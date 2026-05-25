import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VoiceSearchService {
  private recognition: any;
  private isListeningSignal = signal(false);

  public textResult$ = new Subject<string>();
  public isListening = this.isListeningSignal.asReadonly();

  constructor() {
    const { webkitSpeechRecognition }: any = window;
    if (webkitSpeechRecognition) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'uz-UZ'; // Supporting Uzbek
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListeningSignal.set(true);
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.textResult$.next(transcript);
        this.stop();
      };

      this.recognition.onerror = () => {
        this.isListeningSignal.set(false);
      };

      this.recognition.onend = () => {
        this.isListeningSignal.set(false);
      };
    }
  }

  start() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error('Speech recognition already started', e);
      }
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListeningSignal.set(false);
    }
  }

  setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
}
