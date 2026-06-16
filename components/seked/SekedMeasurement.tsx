"use client";

import { useState } from "react";
import { Calculator, Brain, Zap, Shield, Target } from "lucide-react";
import { 
  calculateSekedRatios, 
  getDirective, 
  createSekedState,
  verifySekedState 
} from "../../lib/seked-api";
import type { 
  SekedMeasurement, 
  SekedRatios, 
  SekedDirective, 
  SekedState 
} from "../../types/seked";

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ElementType;
  color: string;
  description: string;
}

function SliderInput({ label, value, onChange, icon: Icon, color, description }: SliderInputProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <label className="font-medium text-white">{label}</label>
            <span className="text-2xl font-bold text-white">{value}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="9"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, currentColor ${(value / 9) * 100}%, #374151 ${(value / 9) * 100}%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0</span>
        <span>9</span>
      </div>
    </div>
  );
}

export default function SekedMeasurement() {
  const [measurement, setMeasurement] = useState<SekedMeasurement>({
    E: 5,
    R: 5,
    C: 5,
    D: 5,
    S: 5,
    timestamp: new Date().toISOString(),
  });

  const [ratios, setRatios] = useState<SekedRatios | null>(null);
  const [directive, setDirective] = useState<SekedDirective | null>(null);
  const [state, setState] = useState<SekedState | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculateSigma = () => {
    const sigma = (measurement.E + measurement.D) / (measurement.R + 1);
    return Number(sigma.toFixed(2));
  };

  const calculateCI = () => {
    const I = 10 - measurement.R;
    const ci = measurement.C / I;
    return Number(ci.toFixed(2));
  };

  const calculateSI = () => {
    const si = measurement.S / 10;
    return Number(si.toFixed(2));
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      // Calculate ratios using SEKED engine
      const calculatedRatios = await calculateSekedRatios(measurement);
      setRatios(calculatedRatios);

      // Get directive for sigma ratio
      const sigmaDirective = await getDirective(calculatedRatios.sigma);
      setDirective(sigmaDirective);

      // Create complete SEKED state
      const sekedState = await createSekedState(measurement);
      setState(sekedState);
    } catch (error) {
      console.error("Failed to calculate SEKED state:", error);
      // Fallback to local calculation
      const localRatios: SekedRatios = {
        sigma: calculateSigma(),
        ci: calculateCI(),
        si: calculateSI(),
      };
      setRatios(localRatios);
    } finally {
      setCalculating(false);
    }
  };

  const updateMeasurement = (key: keyof SekedMeasurement, value: number) => {
    setMeasurement(prev => ({
      ...prev,
      [key]: value,
      timestamp: new Date().toISOString(),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">SEKED Measurement</h2>
          <p className="text-gray-400 mt-1">
            Human state measurement using the SEKED v1.0 specification
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Brain className="w-4 h-4" />
          <span>σ = (E + D) / (R + 1)</span>
        </div>
      </div>

      {/* Measurement Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SliderInput
          label="Energy (E)"
          value={measurement.E}
          onChange={(value) => updateMeasurement('E', value)}
          icon={Zap}
          color="bg-yellow-500"
          description="Physical and mental energy reserves"
        />
        <SliderInput
          label="Resistance (R)"
          value={measurement.R}
          onChange={(value) => updateMeasurement('R', value)}
          icon={Shield}
          color="bg-red-500"
          description="Internal friction and opposition"
        />
        <SliderInput
          label="Clarity (C)"
          value={measurement.C}
          onChange={(value) => updateMeasurement('C', value)}
          icon={Target}
          color="bg-blue-500"
          description="Mental clarity and focus"
        />
        <SliderInput
          label="Drive (D)"
          value={measurement.D}
          onChange={(value) => updateMeasurement('D', value)}
          icon={Calculator}
          color="bg-green-500"
          description="Motivation and forward momentum"
        />
        <SliderInput
          label="Stability (S)"
          value={measurement.S}
          onChange={(value) => updateMeasurement('S', value)}
          icon={Shield}
          color="bg-purple-500"
          description="Emotional and system stability"
        />
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          <Calculator className="w-5 h-5" />
          {calculating ? "Calculating..." : "Calculate SEKED State"}
        </button>
      </div>

      {/* Results */}
      {ratios && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">SEKED Ratios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Sigma (σ)</div>
              <div className="text-2xl font-bold text-blue-400">{ratios.sigma}</div>
              <div className="text-xs text-gray-500 mt-1">Primary operational ratio</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Cognitive Index</div>
              <div className="text-2xl font-bold text-green-400">{ratios.ci}</div>
              <div className="text-xs text-gray-500 mt-1">C / (10 - R)</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Stability Index</div>
              <div className="text-2xl font-bold text-purple-400">{ratios.si}</div>
              <div className="text-xs text-gray-500 mt-1">S / 10</div>
            </div>
          </div>
        </div>
      )}

      {directive && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Directive</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Action Type</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                directive.action_type === 'EXECUTE' ? 'bg-green-500/20 text-green-400' :
                directive.action_type === 'PREPARE' ? 'bg-blue-500/20 text-blue-400' :
                directive.action_type === 'CONSERVE' ? 'bg-yellow-500/20 text-yellow-400' :
                directive.action_type === 'RECOVER' ? 'bg-orange-500/20 text-orange-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {directive.action_type}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Directive</div>
              <div className="text-lg font-medium text-white">{directive.directive}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Reasoning</div>
              <div className="text-sm text-gray-300">{directive.reasoning}</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Confidence</span>
              <span className="text-sm font-medium text-white">{Math.round(directive.confidence * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {state && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">SEKED State</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">State ID</span>
              <span className="text-sm font-mono text-white">{state.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Fingerprint</span>
              <span className="text-sm font-mono text-white">{state.fingerprint.slice(0, 16)}...</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Created</span>
              <span className="text-sm text-white">{new Date(state.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
