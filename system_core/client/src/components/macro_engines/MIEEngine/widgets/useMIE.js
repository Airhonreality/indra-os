import { useState, useEffect, useRef } from 'react';
import { MIEOrchestrator } from '../../../../services/multimedia_core/MIEOrchestrator';
import { MIE_PRESETS } from '../../../../services/multimedia_core/mie_config';

/**
 * useMIE Hook
 * RESPONSABILIDAD: Estado reactivo para la interfaz del motor de ingesta.
 */
export const useMIE = ({ defaultPreset = 'BALANCED', onComplete = null } = {}) => {
    const [jobs, setJobs] = useState([]);
    const [results, setResults] = useState([]);
    const [currentPreset, setCurrentPreset] = useState(defaultPreset);
    const [config, setConfig] = useState(MIE_PRESETS[defaultPreset]);
    const [globalProgress, setGlobalProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const orchestratorRef = useRef(null);

    useEffect(() => {
        orchestratorRef.current = new MIEOrchestrator({
            onProgress: (p) => {
                setJobs(p.jobs);
                setGlobalProgress(p.globalPercent);
            },
            onComplete: (res) => {
                setResults(res);
                setIsProcessing(false);
                if (onComplete) onComplete(res);
            }
        });

        return () => orchestratorRef.current.dispose();
    }, []);

    const updatePreset = (pid) => {
        const newPreset = MIE_PRESETS[pid] || MIE_PRESETS.BALANCED;
        setCurrentPreset(pid);
        setConfig(newPreset);
    };

    const updateConfig = (overrides) => {
        setConfig(prev => ({ ...prev, ...overrides }));
    };

    const queueFiles = (files) => {
        if (!orchestratorRef.current) return;
        orchestratorRef.current.enqueue(files, config);
    };

    const startProcessing = () => {
        if (!orchestratorRef.current || isProcessing) return;
        setIsProcessing(true);
        orchestratorRef.current.start();
    };

    const addFiles = (files) => {
        queueFiles(files);
        startProcessing();
    };

    const clearQueue = () => {
        setJobs([]);
        setResults([]);
        setGlobalProgress(0);
    };

    return {
        jobs,
        results,
        currentPreset,
        updatePreset,
        config,
        updateConfig,
        globalProgress,
        isProcessing,
        addFiles,
        queueFiles,
        startProcessing,
        clearQueue
    };
};
