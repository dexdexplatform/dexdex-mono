import * as React from 'react';

const errorCache: Record<string, boolean> = {};

const noop = () => {
  // nothing to do
};

export interface ImageLoaderProps {
  src: string;
  fallback?: string;
  children: (src: string | undefined, state: ImageState) => JSX.Element;
}

export enum ImageState {
  Loading,
  Ok,
  Failed,
}

export interface ImageLoaderState {
  src: string | undefined;
  status: ImageState;
}

/**
 * Prefetch an image by loading it in a dettached img node and allowing
 * the usage of a fallback image in case its fails. Failed images are
 * locally cached in this component so that they are not loaded again
 * in the future.
 *
 * Once the image is loaded, the children (which must be a function) is called
 * with the 'safeSrc' string to be used as a source for a <img> tag, a background
 * image property of a node or whatever other use you want to have.
 *
 * Children also receive a 'isLoading' flag that allows to add special behavior
 * to be used when the image is still loading (like adding a spinner loader).
 *
 * Usage:
 * <ImageFetcher
 *   src="/my-image.png"
 *   fallback="/my-fallback.png"
 *   onError={(e, src) => console.log('Optional error handler for when the src failed to load')}
 * >
 *   {(safeSrc, isLoading) => isLoading ? <MyLoadingSpinner /> : <img src=`${safeSrc}` />}
 * </ImageFetcher>
 */
export class ImageLoader extends React.Component<ImageLoaderProps, ImageLoaderState> {
  state: ImageLoaderState = {
    src: errorCache[this.props.src] === true ? this.props.fallback : this.props.src,
    status: ImageState.Loading,
  };

  private img: HTMLImageElement | null = null;

  onImageLoad = () => {
    this.setState({ status: ImageState.Ok });
  };

  onImageError = (e: ErrorEvent) => {
    errorCache[this.state.src!] = true;
    if (this.props.fallback) {
      this.img!.src = this.props.fallback;
      this.setState({ src: this.props.fallback, status: ImageState.Loading });
    } else {
      // This could be triggered when the fallback also failed
      this.setState({ src: undefined, status: ImageState.Failed });
    }
  };

  loadImage() {
    if (this.img != null) {
      // Clear current handlers so that current request (should it exists) does not get handled.
      this.img.onerror = noop;
      this.img.onload = noop;
    }
    if (this.state.src != null) {
      this.img = new Image();
      this.img.onerror = this.onImageError;
      this.img.onload = this.onImageLoad;
      this.img.src = this.state.src;
    }
  }

  componentDidMount() {
    this.loadImage();
  }

  componentDidUpdate(prevProps: ImageLoaderProps, prevState: ImageLoaderState) {
    if (this.state.src !== prevState.src) {
      this.loadImage();
    }
  }

  componentWillReceiveProps(nextProps: ImageLoaderProps) {
    if (errorCache[nextProps.src] === true) {
      this.setState({ src: nextProps.fallback, status: ImageState.Loading });
    } else if (this.props.src !== nextProps.src) {
      this.setState({ src: nextProps.src, status: ImageState.Loading });
    }
  }

  componentWillUnmount() {
    // Clear current handlers so that current request (should it exists) does not get handled.
    if (this.img) {
      this.img.onerror = noop;
      this.img.onload = noop;
    }
  }

  render() {
    return this.props.children(this.state.src, this.state.status);
  }
}

// export interface DivImageLoaderProps {
//   className?: string;
//   src: string;
//   fallback?: string;
//   onError?: (src: string, err: ErrorEvent) => void;
//   onLoad?: () => void;
//   progressive?: boolean;
//   tagName?: string;
//   style?: object;
// }

// /**
//  * Loads an image into an <div> tag (as background image) with the
//  * ability to provide a fallback image in case the main one fails.
//  */
// export const DivImageLoader: React.SFC<DivImageLoaderProps> = props => {
//   const {
//     src,
//     fallback,
//     onError,
//     onLoad,
//     progressive,
//     tagName,
//     style,
//     children,
//     ...imgProps
//   } = props;

//   // Make the loading progressive by default.
//   const isProgressive = props.progressive === true || typeof props.progressive === 'undefined';
//   // Render a div by default, but enable rendering other tags.
//   const Element = tagName ? tagName : 'div';

//   return (
//     <ImageFetcher src={src} fallback={fallback} onError={onError} onLoad={onLoad}>
//       {(safeSrc, isLoading) => (
//         <Element
//           {...imgProps}
//           style={Object.assign(
//             {},
//             style,
//             isLoading && !isProgressive ? {} : { backgroundImage: `url(${safeSrc})` }
//           )}
//           data-original-src={src}
//         >
//           {children}
//         </Element>
//       )}
//     </ImageFetcher>
//   );
// };

// DivImageLoader.displayName = 'DivImageLoader';
