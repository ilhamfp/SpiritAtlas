// SPU report format adapted from olvvier/apple-silicon-accelerometer
// revision 203685640287449eaecf521c24d1f5e52486ecb7 (MIT, see LICENSE.macimu).
// Sensor-only process: no sockets, commands, stdin, shared memory, or persistence.
#include <CoreFoundation/CoreFoundation.h>
#include <IOKit/IOKitLib.h>
#include <IOKit/hid/IOHIDDevice.h>
#include <mach/mach_time.h>
#include <math.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
static volatile sig_atomic_t stopped=0;
static double time_scale;
static uint64_t sequence=0;
static int counts[2]={0};
static void stop(int sig){stopped=1;}
static int property(io_service_t svc, CFStringRef key){
 CFTypeRef value=IORegistryEntryCreateCFProperty(svc,key,NULL,0); int n=0;
 if(value){if(CFGetTypeID(value)==CFNumberGetTypeID())CFNumberGetValue(value,kCFNumberIntType,&n);CFRelease(value);}return n;
}
static void report(void *ctx, IOReturn result, void *sender, IOHIDReportType type, uint32_t id, uint8_t *bytes, CFIndex length, uint64_t timestamp){
 if(result||length!=22||stopped)return;int index=(int)(intptr_t)ctx;
 if(++counts[index]%8)return; // ~100 Hz from ~800 Hz native. Measure, do not assume.
 int32_t xyz[3];memcpy(xyz,bytes+6,12);
 printf("{\"v\":1,\"seq\":%llu,\"kind\":\"%s\",\"t\":%.9f,\"unit\":\"%s\",\"xyz\":[%.7f,%.7f,%.7f]}\n",(unsigned long long)++sequence,index?"gyro":"accel",timestamp*time_scale,index?"deg/s":"g",xyz[0]/65536.,xyz[1]/65536.,xyz[2]/65536.);
 fflush(stdout);
}
int main(int argc,char **argv){
 int presence=argc==2&&!strcmp(argv[1],"--presence");
 double seconds=30;if(argc==3&&!strcmp(argv[1],"--seconds"))seconds=strtod(argv[2],NULL);
 if(!isfinite(seconds)||seconds<1||seconds>86400)return 2;
 signal(SIGINT,stop);signal(SIGTERM,stop);signal(SIGPIPE,stop);
 mach_timebase_info_data_t tb;mach_timebase_info(&tb);time_scale=(double)tb.numer/tb.denom*1e-9;
 io_iterator_t it;io_service_t svc;int found=0,opened=0;IOHIDDeviceRef devices[2]={0};static uint8_t buffers[2][4096];
 if(IOServiceGetMatchingServices(kIOMainPortDefault,IOServiceMatching("AppleSPUHIDDevice"),&it))return 3;
 while((svc=IOIteratorNext(it))){int page=property(svc,CFSTR("PrimaryUsagePage")),usage=property(svc,CFSTR("PrimaryUsage"));
  if(page==0xff00&&(usage==3||usage==9)){
   found++;if(!presence){int i=usage==9;IOHIDDeviceRef d=IOHIDDeviceCreate(NULL,svc);
    if(d){IOReturn err=IOHIDDeviceOpen(d,0);if(err==kIOReturnSuccess){devices[i]=d;opened++;IOHIDDeviceRegisterInputReportWithTimeStampCallback(d,buffers[i],4096,report,(void *)(intptr_t)i);IOHIDDeviceScheduleWithRunLoop(d,CFRunLoopGetCurrent(),kCFRunLoopDefaultMode);}else{fprintf(stderr,"sensor_open_failed usage=%d code=0x%x\n",usage,err);CFRelease(d);}}
   }
  }IOObjectRelease(svc);
 }IOObjectRelease(it);
 if(presence){printf("{\"sensor_count\":%d,\"available\":%s}\n",found,found?"true":"false");return found?0:3;}
 if(opened!=2){fprintf(stderr,"Both inertial sensors must open. Use normal sudo authorization if needed.\n");return 4;}
 // Wake only SPU HID drivers; copied upstream control properties, no OS security changes.
 if(IOServiceGetMatchingServices(kIOMainPortDefault,IOServiceMatching("AppleSPUHIDDriver"),&it)==0){
  while((svc=IOIteratorNext(it))){CFStringRef keys[]={CFSTR("SensorPropertyReportingState"),CFSTR("SensorPropertyPowerState"),CFSTR("ReportInterval")};int values[]={1,1,1000};
   for(int j=0;j<3;j++){CFNumberRef n=CFNumberCreate(NULL,kCFNumberIntType,&values[j]);IORegistryEntrySetCFProperty(svc,keys[j],n);CFRelease(n);}IOObjectRelease(svc);
  }IOObjectRelease(it);
 }
 double start=mach_absolute_time()*time_scale;
 while(!stopped&&mach_absolute_time()*time_scale-start<seconds)CFRunLoopRunInMode(kCFRunLoopDefaultMode,.025,false);
 for(int i=0;i<2;i++)if(devices[i]){IOHIDDeviceUnscheduleFromRunLoop(devices[i],CFRunLoopGetCurrent(),kCFRunLoopDefaultMode);IOHIDDeviceClose(devices[i],0);CFRelease(devices[i]);}
 fprintf(stderr,"reader_stopped samples=%llu\n",(unsigned long long)sequence);return sequence?0:5;
}
