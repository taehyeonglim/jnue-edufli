interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="card text-center py-12" role="alert">
      <div className="text-5xl mb-4">⚠️</div>
      <p className="text-slate-500 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary btn-sm">
          다시 시도
        </button>
      )}
    </div>
  )
}
