import * as React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Try to parse Firestore error if it's in our JSON format
    let detailedInfo = null;
    try {
      detailedInfo = JSON.parse(error.message);
    } catch (e) {
      // Not a JSON error
    }

    this.setState({
      error,
      errorInfo: detailedInfo ? JSON.stringify(detailedInfo, null, 2) : error.stack || null
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-stone-900 mb-3">
                問題が発生しました
              </h1>
              
              <p className="text-stone-600 mb-8 leading-relaxed">
                アプリの実行中に予期しないエラーが発生しました。
                {this.state.error?.message.includes('permission') && (
                  <span className="block mt-2 font-medium text-amber-700">
                    アクセス権限エラーが発生した可能性があります。
                  </span>
                )}
              </p>

              {this.state.errorInfo && (
                <div className="mb-8 text-left">
                  <details className="bg-stone-100 rounded-xl p-4 cursor-pointer">
                    <summary className="text-xs font-bold text-stone-500 uppercase tracking-wider select-none">
                      エラーの詳細を確認
                    </summary>
                    <pre className="mt-4 text-[10px] font-mono text-stone-700 overflow-auto max-h-48 whitespace-pre-wrap">
                      {this.state.errorInfo}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-200"
                >
                  <RefreshCw className="w-5 h-5" />
                  再読み込み
                </button>
                
                <button
                  onClick={this.handleReset}
                  className="w-full py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  ホームに戻る
                </button>
              </div>
            </div>
            
            <div className="bg-stone-50 px-8 py-4 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-400">
                問題が解決しない場合は、管理者にお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
