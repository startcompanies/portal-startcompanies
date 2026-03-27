import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SignaturePadComponent),
      multi: true
    }
  ]
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() formControl?: FormControl | null;
  @Input() width: number = 600;
  @Input() height: number = 200;
  @Input() required: boolean = false;
  @Output() signatureChange = new EventEmitter<string | null>();

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  
  // ControlValueAccessor
  private onChange = (value: string | null) => {};
  private onTouched = () => {};
  disabled = false;

  ngAfterViewInit(): void {
    if (!this.canvasRef) {
      console.error('Canvas ref not found');
      return;
    }
    
    this.canvas = this.canvasRef.nativeElement;
    const context = this.canvas.getContext('2d');
    
    if (!context) {
      console.error('Could not get 2D context from canvas');
      return;
    }
    
    this.ctx = context;
    
    // Configurar canvas
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Configurar estilo de dibujo
    this.ctx.strokeStyle = '#000000';
    this.ctx.fillStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Limpiar canvas con fondo blanco
    this.clear();
    
    // Agregar event listeners
    this.setupEventListeners();
    
    // Si hay un valor inicial en el FormControl, cargarlo
    if (this.formControl?.value) {
      this.loadSignature(this.formControl.value);
    }
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), { passive: false });
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: false });
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), { passive: false });
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this), { passive: false });
    
    // Touch events
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false });
  }

  private removeEventListeners(): void {
    // Los event listeners se eliminarán automáticamente cuando el componente se destruya
  }

  private getEventPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    if (e instanceof MouseEvent) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    } else {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    const pos = this.getEventPos(e);
    this.startDrawing(pos.x, pos.y);
    this.onTouched();
  }

  private onMouseMove(e: MouseEvent): void {
    e.preventDefault();
    if (this.isDrawing) {
      const pos = this.getEventPos(e);
      this.draw(pos.x, pos.y);
    }
  }

  private onMouseUp(e: MouseEvent): void {
    e.preventDefault();
    this.stopDrawing();
  }

  private onTouchStart(e: TouchEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    const pos = this.getEventPos(e);
    this.startDrawing(pos.x, pos.y);
    this.onTouched();
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (this.isDrawing) {
      const pos = this.getEventPos(e);
      this.draw(pos.x, pos.y);
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.stopDrawing();
  }

  private startDrawing(x: number, y: number): void {
    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;
    
    // Dibujar un punto inicial para que se vea algo incluso si no se mueve el mouse
    this.ctx.beginPath();
    this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  private draw(x: number, y: number): void {
    if (!this.isDrawing || !this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    
    this.lastX = x;
    this.lastY = y;
    
    // Emitir cambio de firma (solo ocasionalmente para no saturar)
    if (Math.random() < 0.1) {
      this.emitSignature();
    }
  }

  private stopDrawing(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      // Siempre emitir al terminar de dibujar
      this.emitSignature();
    }
  }

  private emitSignature(): void {
    const signatureData = this.getSignatureData();
    this.signatureChange.emit(signatureData);
    this.onChange(signatureData);
    if (this.formControl) {
      this.formControl.setValue(signatureData, { emitEvent: false });
    }
  }

  clear(): void {
    if (!this.canvas || !this.ctx) {
      return;
    }
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.emitSignature();
  }

  /**
   * Escribe el contenido actual del canvas en el FormControl (CVA).
   * Llamar antes de enviar el formulario: el último trazo podría no haberse propagado aún.
   */
  flushToFormControl(): void {
    this.emitSignature();
  }

  getSignatureData(): string | null {
    // Verificar que el canvas y el contexto estén inicializados
    if (!this.canvas || !this.ctx) {
      return null;
    }
    
    // Verificar si el canvas tiene contenido (no solo fondo blanco)
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const hasContent = imageData.data.some((channel, index) => {
      // Ignorar el canal alpha
      if (index % 4 === 3) return false;
      // Si hay algún píxel que no sea blanco (255), hay contenido
      return channel !== 255;
    });
    
    if (!hasContent) {
      return null;
    }
    
    return this.canvas.toDataURL('image/png');
  }

  loadSignature(dataUrlOrHttp: string): void {
    const drawImg = (img: HTMLImageElement) => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      this.emitSignature();
    };

    if (dataUrlOrHttp.startsWith('data:')) {
      const img = new Image();
      img.onload = () => drawImg(img);
      img.src = dataUrlOrHttp;
      return;
    }

    if (dataUrlOrHttp.startsWith('http://') || dataUrlOrHttp.startsWith('https://')) {
      fetch(dataUrlOrHttp, { mode: 'cors', credentials: 'omit' })
        .then((r) => r.blob())
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            drawImg(img);
            URL.revokeObjectURL(objectUrl);
          };
          img.onerror = () => URL.revokeObjectURL(objectUrl);
          img.src = objectUrl;
        })
        .catch(() => {});
      return;
    }

    const img = new Image();
    img.onload = () => drawImg(img);
    img.src = dataUrlOrHttp;
  }

  hasSignature(): boolean {
    if (!this.canvas || !this.ctx) {
      return false;
    }
    return this.getSignatureData() !== null;
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    if (value && this.canvas && this.ctx) {
      this.loadSignature(value);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.canvas) {
      this.canvas.style.pointerEvents = isDisabled ? 'none' : 'auto';
      this.canvas.style.opacity = isDisabled ? '0.5' : '1';
    }
  }
}
