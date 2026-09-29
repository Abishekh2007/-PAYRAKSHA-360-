import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDemoStore } from '../store/demoStore';
import { runLiveSimulation, liveStageInput, getScenario } from '../engine';
import { PageShell } from '../components/layout';
import { Button, SimulationBadge, RiskGauge } from '../components/ui';
import { EngineCore, GuardianRobot } from '../components/three';
import { RiskScoreCard, RiskResultView, PaymentPreview } from '../components/risk';

export default function LiveSimulation() {
  const sim = useMemo(() => runLiveSimulation(), []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1);
  const [isDone, setIsDone] = useState(false);

  const recordAnalysis = useDemoStore((s) => s.recordAnalysis);
  const setCurrent = useDemoStore((s) => useDemoStore.setState({ current: (s as any).current })); // store updates will be done by caller context

  useEffect(() => {
    let timer: number | null = null;
    if (isPlaying && !isDone) {
      timer = window.setTimeout(() => {
        if (currentPhaseIndex < sim.phases.length - 1) {
          setCurrentPhaseIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setIsDone(true);
        }
      }, 800);
    }
    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [isPlaying, currentPhaseIndex, sim.phases.length, isDone]);

  useEffect(() => {
    if (isDone) {
       const finalReport = sim.phases[sim.phases.length - 1].report;
       recordAnalysis({
           label: 'Live scam simulation',
           input: liveStageInput('full'),
           report: finalReport,
           source: 'browser'
       });
    }
  }, [isDone, sim, recordAnalysis]);

  const currentPhase = currentPhaseIndex >= 0 ? sim.phases[currentPhaseIndex] : null;
  const currentScore = currentPhase ? currentPhase.report.score : 0;
  const currentLevel = currentPhase ? currentPhase.report.level : 'LOW';
  const stage = currentPhase ? currentPhase.stage : undefined;

  const handleStart = () => {
    setCurrentPhaseIndex(0);
    setIsPlaying(true);
    setIsDone(false);
  };

  const handleSkip = () => {
    setCurrentPhaseIndex(sim.phases.length - 1);
    setIsPlaying(false);
    setIsDone(true);
  };

  const handleReplay = () => {
    setCurrentPhaseIndex(-1);
    setIsPlaying(false);
    setIsDone(false);
    setTimeout(() => {
        setCurrentPhaseIndex(0);
        setIsPlaying(true);
    }, 100);
  };

  const msgText = getScenario(sim.baseScenario).message || '';
  const urlText = 'http://example.com/demo'; // sim.phases[?].report.url might not be available, let's pull from liveStageInput if needed
  const inputAtCurrentStage = currentPhaseIndex >= 0 ? liveStageInput(currentPhase!.stage) : {};

  return (
    <PageShell eyebrow="Live Attack" title="Live Attack Simulation" subtitle="Watch how Payraksha builds connection" icon={<span>🚨</span>}>
       <SimulationBadge />

       <div className="mb-4">
          <Button variant="danger" size="lg" onClick={handleStart} disabled={currentPhaseIndex >= 0}>
             🚨 RUN LIVE SCAM SIMULATION
          </Button>
          {(currentPhaseIndex >= 0 || isDone) && (
              <div className="flex gap-2 mt-2">
                 <Button onClick={() => setIsPlaying(!isPlaying)} disabled={isDone}>
                   {isPlaying ? 'PAUSE' : 'RESUME'}
                 </Button>
                 <Button onClick={handleSkip} disabled={isDone}>SKIP TO END</Button>
                 <Button onClick={handleReplay}>REPLAY</Button>
              </div>
          )}
       </div>

       {currentPhaseIndex >= 0 && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
            <div>
               <h3 className="font-bold mb-4">Analysis Engine</h3>
               <div className="flex justify-center mb-4">
                  <RiskGauge score={currentScore} level={currentLevel} />
               </div>
               <div className="flex justify-center mb-4">
                  <EngineCore level={currentLevel} active={isPlaying} />
               </div>

               <ol className="space-y-2 mt-8 border-l border-gray-600 pl-4">
                   {sim.phases.map((p, i) => {
                       let state = 'pending';
                       if (i < currentPhaseIndex) state = 'done';
                       else if (i === currentPhaseIndex) state = 'active';

                       return (
                           <motion.li
                              key={p.id}
                              data-state={state}
                              className={`flex items-center gap-2 ${state === 'pending' ? 'text-gray-500 opacity-50' : state === 'active' ? 'text-white font-bold' : 'text-gray-300'}`}
                              animate={{ opacity: state === 'pending' ? 0.5 : 1 }}
                           >
                              <span>{p.icon}</span> <span>{p.text}</span>
                           </motion.li>
                       );
                   })}
               </ol>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 w-72 h-[600px] overflow-hidden flex flex-col mx-auto shrink-0 shadow-xl relative">
                <div className="text-center font-bold text-xs mb-4 text-gray-500 border-b border-gray-800 pb-2">SIMULATED DEVICE</div>
                <div className="flex flex-col gap-4 text-sm">
                   {stage === 'message' || stage === 'url' || stage === 'qr' || stage === 'full' ? (
                        <div className="bg-gray-800 p-3 rounded-lg self-start">
                            {msgText}
                        </div>
                   ) : null}

                   {(stage === 'url' || stage === 'qr' || stage === 'full') && inputAtCurrentStage.url && (
                        <div className="text-blue-400 break-all p-2 bg-gray-800 rounded">
                           {inputAtCurrentStage.url}
                        </div>
                   )}

                   {(stage === 'qr' || stage === 'full') && inputAtCurrentStage.qrText && (
                        <div className="bg-white text-black p-4 rounded-lg flex flex-col gap-1 items-center">
                            <span className="font-mono text-xs">QR DETECTED</span>
                            <span className="text-[10px] break-all">{inputAtCurrentStage.qrText.substring(0, 30)}...</span>
                        </div>
                   )}

                   {stage === 'full' && inputAtCurrentStage.payment && (
                        <div className="mt-4">
                            <PaymentPreview payment={inputAtCurrentStage.payment as any} />
                        </div>
                   )}
                </div>
            </div>
         </div>
       )}

       {isDone && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 mb-20 space-y-8">
              <div className="text-center">
                 <h2 className="text-4xl font-bold text-red-500 mb-4">🛑 DON'T PAY YET</h2>
                 <div className="w-48 mx-auto -mt-6">
                    <GuardianRobot mood="alert" />
                 </div>
              </div>
              <RiskScoreCard report={sim.phases[sim.phases.length - 1].report} />
              <RiskResultView report={sim.phases[sim.phases.length - 1].report} source="browser" />
           </motion.div>
       )}
    </PageShell>
  );
}
