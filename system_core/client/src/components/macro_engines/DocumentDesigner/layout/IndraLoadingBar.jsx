
export function IndraLoadingBar({ width = '140px', height = '4px' }) {
    return (
        <div
            className="indra-loading-bar"
            role="progressbar"
            aria-label="loading"
            style={{ width, height }}
        >
            <div className="indra-loading-bar__track" />
            <div className="indra-loading-bar__runner" />

            <style>{`
                .indra-loading-bar {
                    position: relative;
                    overflow: hidden;
                    border-radius: 999px;
                }

                .indra-loading-bar__track {
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: var(--color-border);
                    opacity: 0.35;
                }

                .indra-loading-bar__runner {
                    position: absolute;
                    top: 0;
                    left: -30%;
                    width: 30%;
                    height: 100%;
                    border-radius: inherit;
                    background: linear-gradient(90deg, transparent 0%, var(--color-accent) 45%, transparent 100%);
                    animation: indra-loading-bar-slide 1.1s ease-in-out infinite;
                }

                @keyframes indra-loading-bar-slide {
                    0% { left: -30%; }
                    100% { left: 100%; }
                }
            `}</style>
        </div>
    );
}

export default IndraLoadingBar;
