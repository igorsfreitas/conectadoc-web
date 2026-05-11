import { Component, ErrorInfo, ReactNode } from "react";
import { Log } from "../logger/log_wrapper";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Log.screen("React Render Error", {
      error: {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  public render() {
    if (this.state.hasError) {
      //   return (
      //     <div style={{
      //       display: 'flex',
      //       flexDirection: 'column',
      //       alignItems: 'center',
      //       justifyContent: 'center',
      //       height: '100vh',
      //       fontFamily: 'sans-serif',
      //       color: '#333'
      //     }}>
      //       <h2>Ops! Algo deu errado.</h2>
      //       <p>Ocorreu um erro inesperado. Por favor, tente recarregar a página.</p>
      //       <button
      //         onClick={() => window.location.reload()}
      //         style={{
      //           marginTop: '16px',
      //           padding: '8px 16px',
      //           cursor: 'pointer',
      //           fontSize: '16px'
      //         }}
      //       >
      //         Recarregar Página
      //       </button>
      //     </div>
      //   );
      return null;
    }

    return this.props.children;
  }
}
