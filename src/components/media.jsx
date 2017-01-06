import React from 'react';
import { connect } from 'react-redux';

import actions, { pause } from '../actions/jPlayerActions';
import { classes } from '../util/constants';
import { mapStateToProps, urlNotSupportedError,
        convertTime, limitValue } from '../util/index';
import jPlayerConnect from '../jPlayerConnect';

const mapJPlayerProps = (jPlayers, id) => ({
  ...jPlayers[id],
});

class Media extends React.Component {
  static get defaultProps() {
    return {
      onProgress: () => null,
      onTimeUpdate: () => null,
      onDurationChange: () => null,
      onPlay: () => null,
      onEnded: () => null,
      onError: () => null,
      onRateChange: () => null,
      onSeeking: () => null,
      onSeeked: () => null,
    };
  }
  static get propTypes() {
    return {
      dispatch: React.PropTypes.func,
      onProgress: React.PropTypes.func,
      onTimeUpdate: React.PropTypes.func,
      onDurationChange: React.PropTypes.func,
      onRateChange: React.PropTypes.func,
      onSeeking: React.PropTypes.func,
      onSeeked: React.PropTypes.func,
      onPlay: React.PropTypes.func,
      onRepeat: React.PropTypes.func,
      onEnded: React.PropTypes.func,
      onError: React.PropTypes.func,
      onPlaying: React.PropTypes.func,
      onPause: React.PropTypes.func,
      onWaiting: React.PropTypes.func,
      onSuspend: React.PropTypes.func,
      onVolumeChange: React.PropTypes.func,
      onLoadStart: React.PropTypes.func,
      onLoadedMetadata: React.PropTypes.func,
      onAbort: React.PropTypes.func,
      onEmptied: React.PropTypes.func,
      onStalled: React.PropTypes.func,
      onLoadedData: React.PropTypes.func,
      onCanPlay: React.PropTypes.func,
      onCanPlayThrough: React.PropTypes.func,
      playbackRateText: React.PropTypes.string,
      loop: React.PropTypes.bool,
      media: React.PropTypes.shapre({
        media: {
          title: React.PropTypes.string,
          artist: React.PropTypes.string,
          mp3: React.PropTypes.string,
          poster: React.PropTypes.string,
          free: React.PropTypes.bool,
        },
      }),
      remainingDuration: React.PropTypes.number,
      id: React.PropTypes.string,
      src: React.PropTypes.string,
      newTime: React.PropTypes.string,
      playHeadPercent: React.PropTypes.number,
      paused: React.PropTypes.bool,
      attributes: React.PropTypes.node,
      children: React.PropTypes.element,
    };
  }
  constructor(props) {
    super(props);

    this.state = {};

    this.events = {
      onProgress: () => {
        const bufferedTimeRanges = [];

        this.currentMedia.buffered.forEach((_, i) => {
          bufferedTimeRanges.push({
            start: this.currentMedia.buffered.start(i),
            end: this.currentMedia.buffered.end(i),
          });
        });

        this.props.dispatch(actions.updateOption('bufferedTimeRanges',
                bufferedTimeRanges, this.props.id));
        this.updateMediaStatus();
        this.props.onProgress();
      },
      onTimeUpdate: () => {
        this.updateMediaStatus();
        this.props.onTimeUpdate();
      },
      onDurationChange: () => {
        this.updateMediaStatus();
        this.props.onDurationChange();
      },
      onRateChange: () => {
        const playbackRateText = this.currentMedia.playbackRate.toFixed(
          limitValue(this.props.playbackRateText, 0, 20));

        this.props.dispatch(actions.updateOption('playbackRateText',
                playbackRateText, this.props.id));
        this.props.onRateChange();
      },
      onSeeking: () => {
        this.props.dispatch(actions.updateOption('seeking', true, this.props.id));
        this.props.onSeeking();
      },
      onSeeked: () => {
        this.props.dispatch(actions.updateOption('seeking', false, this.props.id));
        this.props.onSeeked();
      },
      onPlay: () => {
        this.props.dispatch(actions.updateOption('paused', false, this.props.id));
        this.props.onPlay();
      },
      onEnded: () => {
                // Pause otherwise a click on the progress bar will play from that point, when it shouldn't, since it stopped playback.
        this.props.dispatch(pause(this.props.id));
        this.updateMediaStatus();

        if (this.props.loop === 'loop') {
          this.props.onRepeat();
        }
        this.props.onEnded();
      },
      onError: () => {
        this.props.dispatch(actions.updateOption('error',
                urlNotSupportedError(this.props.media.src), this.props.id));
        this.props.onError();
      },
      onPlaying: this.props.onPlaying,
      onPause: this.props.onPause,
      onWaiting: this.props.onWaiting,
      onSuspend: this.props.onSuspend,
      onVolumeChange: this.props.onVolumeChange,
      onLoadStart: this.props.onLoadStart,
      onLoadedMetadata: this.props.onLoadedMetadata,
      onAbort: this.props.onAbort,
      onEmptied: this.props.onEmptied,
      onStalled: this.props.onStalled,
      onLoadedData: this.props.onLoadedData,
      onCanPlay: this.props.onCanPlay,
      onCanPlayThrough: this.props.onCanPlayThrough,
    };
  }
  componentWillReceiveProps(nextProps) {
    this.updateCurrentMedia(nextProps);
  }
  getCurrentPercentRelative = () => {
    let currentPercentRelative = 0;

    if (this.currentMedia.seekable.length > 0) {
      currentPercentRelative = 100 * (this.currentMedia.currentTime /
            this.currentMedia.seekable.end(this.currentMedia.seekable.length - 1));
    }
    return currentPercentRelative;
  }
  updateMediaStatus = () => {
    let seekPercent = 0;
    let durationText = '';

    const remaining = this.currentMedia.duration - this.currentMedia.currentTime;
    const currentTimeText = convertTime(this.currentMedia.currentTime);
    const currentPercentAbsolute = 100 * (this.currentMedia.currentTime /
            this.currentMedia.duration);

    if (this.currentMedia.seekable.length > 0) {
      seekPercent = 100 * (this.currentMedia.seekable.end(this.currentMedia.seekable.length - 1) /
             this.currentMedia.duration);
    }

    if (this.props.remainingDuration) {
      durationText = (remaining > 0 ? '-' : '') + convertTime(remaining);
    } else {
      durationText = convertTime(this.currentMedia.duration);
    }

    this.props.dispatch(actions.updateOption('durationText', durationText, this.props.id));
    this.props.dispatch(actions.updateOption('currentTimeText', currentTimeText, this.props.id));
    this.props.dispatch(actions.updateOption('seekPercent', seekPercent, this.props.id));
    this.props.dispatch(actions.updateOption('currentPercentRelative',
            this.getCurrentPercentRelative(), this.props.id));
    this.props.dispatch(actions.updateOption('currentPercentAbsolute',
            currentPercentAbsolute, this.props.id));
    this.props.dispatch(actions.updateOption('currentTime',
            this.currentMedia.currentTime, this.props.id));
    this.props.dispatch(actions.updateOption('remaining', remaining, this.props.id));
    this.props.dispatch(actions.updateOption('duration',
            this.currentMedia.duration, this.props.id));
    this.props.dispatch(actions.updateOption('playbackRate',
            this.currentMedia.playbackRate, this.props.id));
    // this.props.dispatch(updateOption("videoWidth", this.currentMedia.videoWidth, this.props.id));
    // this.props.dispatch(updateOption("videoHeight", this.currentMedia.videoHeight, this.props.id));
    // this.props.dispatch(updateOption("ended", this.currentMedia.ended, this.props.id));
  }
  updateCurrentMedia = (nextProps) => {
    if (nextProps.src !== this.props.src) {
      this.currentMedia.src = nextProps.src;
    }

    if (nextProps.newTime !== this.props.newTime) {
      this.currentMedia.currentTime = nextProps.newTime;
    }

    if (nextProps.playHeadPercent !== this.props.playHeadPercent) {
      // TODO: Investigate why some .mp3 urls don't fire media events enough (http://www.davidgagne.net/m/song.mp3).
      // Hasn't fully loaded the song????
      if (this.currentMedia.seekable.length > 0) {
        this.currentMedia.currentTime = nextProps.playHeadPercent *
                (this.currentMedia.seekable.end(this.currentMedia.seekable.length - 1) / 100);
        // Media events don't fire fast enough to give a smooth animation when dragging so we update it here as well, same problem as above?
        this.props.dispatch(actions.updateOption('currentPercentRelative',
                this.getCurrentPercentRelative(), this.props.id));
      }
    }

    if (nextProps.paused !== this.props.paused) {
      if (nextProps.paused) {
        this.currentMedia.pause();
      } else {
        this.currentMedia.play();
      }
    }

    this.currentMedia.defaultPlaybackRate = nextProps.defaultPlaybackRate;
    this.currentMedia.playbackRate = nextProps.playbackRate;
    this.currentMedia.preload = nextProps.preload;
    this.currentMedia.volume = nextProps.volume;
    this.currentMedia.muted = nextProps.muted;
    this.currentMedia.autoplay = nextProps.autoplay;
    this.currentMedia.loop = nextProps.loop === 'loop';
  }
  render() {
    return (
      <div className={classes.MEDIA} {...this.props.attributes}>
        {React.Children.map(this.props.children, child => React.cloneElement(child,
          {
            ...this.events,
            setCurrentMedia: ref => (this.currentMedia = ref),
          },
        ))}
      </div>
    );
  }
}

export default connect(mapStateToProps)(jPlayerConnect(Media, mapJPlayerProps));