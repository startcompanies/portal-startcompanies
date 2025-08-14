import {
  Component,
  Inject,
  Input,
  OnInit,
  PLATFORM_ID,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare var YT: any;

@Component({
  selector: 'app-youtube-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.css'],
})
export class YoutubePlayerComponent implements OnInit {
  @Input() videoId!: string;
  @Input() title = 'Video';

  @ViewChild('ytPlayer') ytPlayerRef!: ElementRef<HTMLIFrameElement>;

  safeUrl?: SafeResourceUrl;
  isBrowser = false;
  showIframe = false;
  player: any;
  state: 'idle' | 'playing' | 'paused' | 'ended' = 'idle';

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadYTAPI();
    }
  }

  get thumbnailUrl(): string {
    return `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`;
  }

  get iframeUrl(): string {
    return `https://www.youtube.com/embed/${this.videoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
  }

  loadYTAPI() {
    if (!document.querySelector('#youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    (window as any).onYouTubeIframeAPIReady = () => {
      if (this.showIframe) this.initPlayer();
    };
  }

  loadAndPlay() {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.iframeUrl
    );
    this.showIframe = true;
    setTimeout(() => this.initPlayer(), 100);
  }

  initPlayer() {
    this.player = new YT.Player(this.ytPlayerRef.nativeElement, {
      events: {
        onReady: () => this.playVideo(),
        onStateChange: (event: any) => this.onStateChange(event),
      },
    });
  }

  onStateChange(event: any) {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        this.state = 'playing';
        break;
      case YT.PlayerState.PAUSED:
        this.state = 'paused';
        break;
      case YT.PlayerState.ENDED:
        this.state = 'ended';
        break;
      default:
        this.state = 'idle';
    }
  }

  playVideo() {
    this.player?.playVideo();
  }

  restartVideo() {
    this.player?.seekTo(0, true);
    this.player?.playVideo();
  }
}
