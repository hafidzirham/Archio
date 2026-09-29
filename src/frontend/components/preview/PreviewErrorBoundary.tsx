import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

import UnsupportedPreview from "./unsupported/UnsupportedPreview";

interface PreviewErrorBoundaryProps {
  children: ReactNode;
  fileName?: string;
  extension?: string;
}

interface PreviewErrorBoundaryState {
  hasError: boolean;
}

class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  public state: PreviewErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): PreviewErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo,
  ) {
    console.error(
      "[Archio] Preview gagal dirender:",
      error,
    );

    console.error(
      "[Archio] Preview component info:",
      errorInfo,
    );

    console.error(
      "[Archio] File:",
      this.props.fileName,
    );

    console.error(
      "[Archio] Extension:",
      this.props.extension,
    );
  }

  componentDidUpdate(
    previousProps: PreviewErrorBoundaryProps,
  ) {
    /*
     * Kalau user pindah ke file berikutnya,
     * reset error boundary.
     */
    if (
      previousProps.fileName !==
        this.props.fileName ||
      previousProps.extension !==
        this.props.extension
    ) {
      if (this.state.hasError) {
        this.setState({
          hasError: false,
        });
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <UnsupportedPreview
          fileName={this.props.fileName}
          extension={this.props.extension}
        />
      );
    }

    return this.props.children;
  }
}

export default PreviewErrorBoundary;