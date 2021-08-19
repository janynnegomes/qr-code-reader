import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
// ES6 import
import jsQR from "jsqr";
import { error } from 'protractor';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit{
  constructor( public cdRef:ChangeDetectorRef) {}
  ngAfterViewInit(): void {
    this.canvas = this.canvasElement.nativeElement.getContext("2d");
    this.initCamera();
  }

  ngOnInit(): void {

  }

  public  stream;

  @ViewChild('canvas',{static:false}) public canvasElement: ElementRef<HTMLCanvasElement>;
  @ViewChild('loadingMessage',{static:false}) public loadingMessage: ElementRef<HTMLDivElement>;
  @ViewChild('output',{static:false}) public output: ElementRef<HTMLDivElement>;
  @ViewChild('video',{static:false}) public video: ElementRef<HTMLVideoElement>;

  public canvas: CanvasRenderingContext2D;
  currentWidth:number;
  currentHeight:number;
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
     this.loadingMessage.nativeElement.innerText = "⌛ Abrindo a câmera ...";
      
  
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
          this.drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#14fd4d");
          this.drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#14fd4d");
          this.drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#14fd4d");
          this.drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#14fd4d");
          
          if(code.data && code.data.length > 0){
            this.outputData=code.data;
            console.log('data',code.data);

            this.video.nativeElement.pause();
            
            window['stopVideo'] = 'true';

            this.closeCamera()
            this.cdRef.detectChanges();

            
          }
          
        } else {
          this.outputData = '';
        }
      }
      window.requestAnimationFrame(this.tick.bind(this));
    }
    
  }

  initCamera(){
    const fullHDConstraints = { width: {exact: 1920}, height: {exact: 1080}};    
    const vgaConstraints = { width: {exact: 640}, height: {exact: 480} };    
    const hdConstraints = {width: {exact: 1280}, height: {exact: 720}};

    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      this.getStream(fullHDConstraints).then(stream => {   
        this.currentHeight = fullHDConstraints.height.exact;     
        this.currentWidth= fullHDConstraints.width.exact;  
      }).catch(fullHDError=>{
        this.getStream(hdConstraints).then(stream => {
          this.currentHeight = hdConstraints.height.exact;     
          this.currentWidth= hdConstraints.width.exact;  
        })
        .catch(hdError=>{
          this.getStream(vgaConstraints).then(stream => {
            this.currentHeight = vgaConstraints.height.exact;     
            this.currentWidth= vgaConstraints.width.exact;  
          })
        })
      });
    }
  }

  getStream(constraints){
  return new Promise((resolve, reject)=>{
    navigator.mediaDevices.getUserMedia({ video:  { facingMode: "environment", ...constraints } })
      .then(stream => {     
        window['stopVideo'] = 'false';  
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.setAttribute("playsinline", 'true'); // required to tell iOS safari we don't want fullscreen
        this.video.nativeElement.play();
        window.requestAnimationFrame(this.tick.bind(this));
        resolve(true);
        }).catch(error=>reject(error));
    });
  }

  closeCamera(){
    navigator.mediaDevices.getUserMedia({ video:  { facingMode: "environment" } }).then(stream => {
      const tracks = stream.getTracks();
      tracks[0].stop;
    });
  }

  restart(){
    this.outputData= '';
    this.initCamera();
  }
}
