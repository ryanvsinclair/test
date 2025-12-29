interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? "w-8 bg-accent"
                  : step < currentStep
                  ? "bg-accent/50"
                  : "bg-border"
              }`}
            />
            {step < 3 && (
              <div
                className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${
                  step < currentStep ? "bg-accent/50" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
