import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
// ES6 import
import jsQR from "jsqr";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit{
  constructor( public cdRef:ChangeDetectorRef) {}
  ngAfterViewInit(): void {
    this.canvas = this.canvasElement.nativeElement.getContext("2d");

    //  // Use facingMode: environment to attemt to get the front camera on phones
    // navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
    //   if(this.video.nativeElement){
    //     this.video.nativeElement.srcObject= stream;
    //     this.video.nativeElement.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    //     this.video.nativeElement.play();
    //     requestAnimationFrame(this.tick);
    //   }
    // });

    this.initCamera();
  }

  ngOnInit(): void {

  }

  title = 'qr-code-reader';

  //video = document.createElement("video");
  @ViewChild('canvas',{static:false}) public canvasElement: ElementRef<HTMLCanvasElement>;
  @ViewChild('loadingMessage',{static:false}) public loadingMessage: ElementRef<HTMLDivElement>;
  @ViewChild('output',{static:false}) public output: ElementRef<HTMLDivElement>;
  @ViewChild('video',{static:false}) public video: ElementRef<HTMLVideoElement>;

  public canvas: CanvasRenderingContext2D;

  outputData:string = '';


  drawLine(begin, end, color) {
    this.canvas.beginPath();
    this.canvas.moveTo(begin.x, begin.y);
    this.canvas.lineTo(end.x, end.y);
    this.canvas.lineWidth = 4;
    this.canvas.strokeStyle = color;
    this.canvas.stroke();
  }

 
   tick() {

    if(window['stopVideo'] === 'false'){
      if(this.loadingMessage) {
        this.loadingMessage.nativeElement.innerText = "⌛ Loading video...";
      }
  
      if ( this.video.nativeElement.readyState === this.video.nativeElement.HAVE_ENOUGH_DATA) {
        this.loadingMessage.nativeElement.hidden = true;
        this.canvasElement.nativeElement.hidden = false;
        //this.outputContainer.hidden = false;
  
        this.canvasElement.nativeElement.height = this.video.nativeElement.videoHeight;
        this.canvasElement.nativeElement.width = this.video.nativeElement.videoWidth;
        this.canvas.drawImage(this.video.nativeElement, 0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
        var imageData = this.canvas.getImageData(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          this.drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
          this.drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
          this.drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
          this.drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
          
          if(code.data && code.data.length > 0){
            this.outputData=code.data;
            console.log('data',code.data);
            navigator.mediaDevices.getUserMedia({ video:  { facingMode: "environment" } }).then(stream => {
              if(this.video){           
                const tracks = stream.getTracks();
                tracks[0].stop;
                //this.video.nativeElement.pause();
                window['stopVideo'] = 'true';

                this.cdRef.detectChanges();
              }});
          }
          
        } else {
          this.outputData = '';
        }
      }
      window.requestAnimationFrame(this.tick.bind(this));
    }
    
  }

  initCamera(){
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video:  { facingMode: "environment" } }).then(stream => {
          if(this.video){
            window['stopVideo'] = 'false';
            this.video.nativeElement.srcObject = stream;
            this.video.nativeElement.setAttribute("playsinline", 'true'); // required to tell iOS safari we don't want fullscreen
            this.video.nativeElement.play();
            window.requestAnimationFrame(this.tick.bind(this));
          }
      });
    }
  }

  restart(){
    this.initCamera();
  }
}
