// To prevent the browser's default touch behavior from overriding
// this library's pointer handling, the touch-action property
// must be applied to the element.

export default class GestureDetector {
  constructor(element) {
    if(!element) {
      throw 'You must provide a HTMLElement.';
    }

    // Properties
    this.endSwipe = {};
    this.fingers = 0;
    this.events = { // Events availables
      pinchin: [],
      pinchout: [],
      swipedown: [],
      swipeleft: [],
      swiperight: [],
      swipeup: [],
    };
    this.options = {
      swipeDistance: 8,
    };
    this.pinchName = undefined;
    this.prevDiff = -1;
    this.startSwipe = {};

    // Gestures detection
    element.addEventListener('touchstart', (event) => {
      this.fingers++;

      // Store positions to detect the start of a swipe gesture
      this.startSwipe.x = event.touches[0].clientX;
      this.startSwipe.y = event.touches[0].clientY;
    });
    element.addEventListener('touchmove', (event) => {
      // Store positions to detect the end of a swipe gesture.
      if(this.fingers == 1) {
        this.endSwipe.x = event.touches[0].clientX;
        this.endSwipe.y = event.touches[0].clientY;
      }

      /**
       * PINCH
       */
      // This function implements a 2-pointer horizontal pinch/zoom gesture.
      if(this.fingers == 2) {
        const fingerOne = event.touches[0];
        const fingerTwo = event.touches[1];
        // Calculate the distance between the two pointers
        const curDiff = Math.hypot(
          fingerOne.clientX - fingerTwo.clientX,
          fingerOne.clientY - fingerTwo.clientY
        );
        if(this.prevDiff > 0) {
          if(curDiff > this.prevDiff) {
            this.pinchName  = 'pinchout';
          } else if(curDiff < this.prevDiff) {
            this.pinchName  = 'pinchin';
          }
        }

        // Cache the distance for the next move event
        this.prevDiff = curDiff;
      }
    });
    element.addEventListener('touchend', (event) => {
      /**
       * SWIPE
       */
      if(this.fingers == 1) {
        const thresholdDistance = this.options.swipeDistance;
        const deltaX = this.endSwipe.x - this.startSwipe.x;
        const deltaY = this.endSwipe.y - this.endSwipe.y;
        const deltaYDistance = Math.abs(deltaY) < thresholdDistance;

        if(deltaX > thresholdDistance && deltaYDistance) {
          this.trigger('swipeleft', event);
        } else if(-deltaX > thresholdDistance && deltaYDistance) {
          this.trigger('swiperight', event);
        }
      }

      // Trigger ends
      if(this.pinchName) {
        this.trigger(this.pinchName, event);
      }

      // Clear
      this.clear();
    });
    element.addEventListener('scroll', () => {
        this.fingers = 0;
    });

    // Trigger events to listeners.
    this.trigger = (type, event) => {
      for(let i = 0; i < this.events[type].length; ++i) {
        this.events[type][i](event);
      }
    };

    this.clear = () => {
      this.endSwipe = {};
      this.fingers = 0;
      this.hasPinch = false;
      this.pinchName = undefined;
      this.prevDiff = -1;
      this.startSwipe = {};
    };
  }

  // Public methods
  /**
   * Use this to listen events.
   * @param {string} type of event to listen.
   * @param {Object} fn Callback function
   */
  on(type, fn) {
    if(this.events[type]) {
      this.events[type].push(fn);
      return {
        type,
        fn,
        cancel: () => this.off(type, fun)
      }
    }
  }

  /**
   * Use this to unregister events.
   * @param {string} type of event to stop listen.
   * @param {Object} fn Callback function
   */
  off(type, fn) {
    if(this.events[type]) {
      const index = this.events[type].indexOf(fn);
      if(index !== -1) {
        this.events[type].splice(index, 1);
      }
    }
  }
}
