
"use client";

import { useRef, useState } from "react";
import {
  Mic,
  Square,
  Loader2,
  Volume2,
} from "lucide-react";
import { createExposureLogAction } from "@/app/lib/actions/exposure-session";
import { toast } from "sonner";

interface AudioRecorderProps {
  eventId: string;
}

/**
 * =========================================================
 * AUDIO CALIBRATION
 * =========================================================
 *
 * IMPORTANT :
 *
 * Le navigateur fournit un niveau en dBFS.
 * Il ne fournit PAS directement des dBA calibrés.
 *
 * Cette valeur est donc un OFFSET.
 *
 * Pour une vraie application professionnelle,
 * cette valeur devra être calibrée avec un sonomètre
 * de référence.
 */
const CALIBRATION_OFFSET = 94;

export default function AudioRecorder({
  eventId,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [currentDb, setCurrentDb] =
    useState(0);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  // ======================================================
  // AUDIO REFERENCES
  // ======================================================

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const analyserRef =
    useRef<AnalyserNode | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const sourceRef =
    useRef<MediaStreamAudioSourceNode | null>(null);

  // ======================================================
  // TIMERS
  // ======================================================

  const measurementIntervalRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const timerIntervalRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  // ======================================================
  // SESSION DATA
  // ======================================================

  const startTimeRef =
    useRef<number>(0);

  const measurementsRef =
    useRef<number[]>([]);

  const peakRef =
    useRef<number>(0);

  // ======================================================
  // RMS
  // ======================================================

  const calculateRMS = (
    data: Float32Array
  ) => {
    let sum = 0;

    for (
      let i = 0;
      i < data.length;
      i++
    ) {
      const sample = data[i];

      sum += sample * sample;
    }

    return Math.sqrt(
      sum / data.length
    );
  };

  // ======================================================
  // RMS → dBFS
  // ======================================================

  const rmsToDbFS = (
    rms: number
  ) => {
    if (
      !Number.isFinite(rms) ||
      rms <= 0
    ) {
      return -Infinity;
    }

    return (
      20 * Math.log10(rms)
    );
  };

  // ======================================================
  // dBFS → dBA ESTIMATED
  // ======================================================

  const dbfsToDba = (
    dbfs: number
  ) => {
    if (!Number.isFinite(dbfs)) {
      return null;
    }

    const dba =
      dbfs +
      CALIBRATION_OFFSET;

    /**
     * Protection.
     */
    return Math.max(
      0,
      Math.min(140, dba)
    );
  };

  // ======================================================
  // MEASURE
  // ======================================================

  const measureSound = () => {
    const analyser =
      analyserRef.current;

    if (!analyser) {
      console.warn(
        "AnalyserNode unavailable"
      );

      return;
    }

    /**
     * Float PCM data.
     *
     * Les valeurs sont généralement
     * comprises entre -1 et +1.
     */
    const buffer =
      new Float32Array(
        analyser.fftSize
      );

    analyser.getFloatTimeDomainData(
      buffer
    );

    /**
     * RMS
     */
    const rms =
      calculateRMS(buffer);

    /**
     * dBFS
     */
    const dbfs =
      rmsToDbFS(rms);

    /**
     * dBA estimé
     */
    const dba =
      dbfsToDba(dbfs);

    console.log(
      "AUDIO:",
      {
        rms,
        dbfs,
        dba,
      }
    );

    if (
      dba === null ||
      !Number.isFinite(dba)
    ) {
      return;
    }

    /**
     * Ajouter la mesure.
     */
    measurementsRef.current.push(
      dba
    );

    /**
     * Peak.
     */
    if (
      dba >
      peakRef.current
    ) {
      peakRef.current = dba;
    }

    /**
     * Affichage live.
     */
    setCurrentDb(
      Number(dba.toFixed(1))
    );
  };

  // ======================================================
  // START
  // ======================================================

  const startRecording =
    async () => {
      try {
        setLoading(true);

        console.log(
          "🎙️ Requesting microphone..."
        );

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
              },
            }
          );

        console.log(
          "🎙️ Microphone granted"
        );

        streamRef.current =
          stream;

        // ==================================================
        // AUDIO CONTEXT
        // ==================================================

        const AudioContextClass =
          window.AudioContext ||
          (window as any)
            .webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error(
            "AudioContext is not supported by this browser."
          );
        }

        const audioContext =
          new AudioContextClass();

        audioContextRef.current =
          audioContext;

        console.log(
          "AudioContext state:",
          audioContext.state
        );

        // ==================================================
        // RESUME AUDIO CONTEXT
        // ==================================================

        if (
          audioContext.state ===
          "suspended"
        ) {
          await audioContext.resume();
        }

        console.log(
          "AudioContext resumed:",
          audioContext.state
        );

        // ==================================================
        // ANALYSER
        // ==================================================

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 2048;

        analyser.smoothingTimeConstant = 0;

        analyserRef.current =
          analyser;

        // ==================================================
        // SOURCE
        // ==================================================

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        sourceRef.current =
          source;

        source.connect(
          analyser
        );

        console.log(
          "🎧 Audio source connected"
        );

        // ==================================================
        // RESET SESSION
        // ==================================================

        measurementsRef.current =
          [];

        peakRef.current = 0;

        startTimeRef.current =
          Date.now();

        setElapsedSeconds(0);

        setCurrentDb(0);

        setIsRecording(true);

        setLoading(false);

        // ==================================================
        // MEASURE EVERY 100ms
        // ==================================================

        measurementIntervalRef.current =
          setInterval(
            measureSound,
            100
          );

        // ==================================================
        // TIMER
        // ==================================================

        timerIntervalRef.current =
          setInterval(() => {
            const elapsed =
              Date.now() -
              startTimeRef.current;

            setElapsedSeconds(
              Math.floor(
                elapsed / 1000
              )
            );
          }, 1000);

        console.log(
          "🎙️ RECORDING STARTED"
        );
      } catch (error) {
        console.error(
          "❌ Microphone error:",
          error
        );

        setLoading(false);

        toast.error(
          error instanceof Error
            ? error.message
            : "Not able to access microphone"
        );
      }
    };

  // ======================================================
  // STOP
  // ======================================================

  const stopRecording =
    async () => {
      if (!isRecording) {
        return;
      }

      setIsRecording(false);

      setLoading(true);

      console.log(
        "🛑 STOP RECORDING"
      );

      // ==================================================
      // STOP MEASUREMENT TIMER
      // ==================================================

      if (
        measurementIntervalRef.current
      ) {
        clearInterval(
          measurementIntervalRef.current
        );

        measurementIntervalRef.current =
          null;
      }

      // ==================================================
      // STOP TIMER
      // ==================================================

      if (
        timerIntervalRef.current
      ) {
        clearInterval(
          timerIntervalRef.current
        );

        timerIntervalRef.current =
          null;
      }

      // ==================================================
      // STOP MICROPHONE
      // ==================================================

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            }
          );

        streamRef.current =
          null;
      }

      // ==================================================
      // DISCONNECT SOURCE
      // ==================================================

      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {}
        
        sourceRef.current =
          null;
      }

      // ==================================================
      // CLOSE AUDIO CONTEXT
      // ==================================================

      if (
        audioContextRef.current
      ) {
        try {
          await audioContextRef.current.close();
        } catch {}

        audioContextRef.current =
          null;
      }

      // ==================================================
      // MEASUREMENTS
      // ==================================================

      const measurements =
        measurementsRef.current;

      console.log(
        "📊 Total measurements:",
        measurements.length
      );

      console.log(
        "📊 Measurements:",
        measurements
      );

      // ==================================================
      // NO DATA
      // ==================================================

      if (
        measurements.length === 0
      ) {
        setLoading(false);

        toast.error(
          "No sound data was recorded. Check that the microphone is working."
        );

        return;
      }

      // ==================================================
      // DURATION
      // ==================================================

      const durationMs =
        Date.now() -
        startTimeRef.current;

      const durationMinutes =
        Math.max(
          durationMs / 60000,
          0.01
        );

      // ==================================================
      // LEQ
      // ==================================================

      /**
       * Leq doit être calculé
       * énergétiquement.
       */
      let energySum = 0;

      for (
        const db of measurements
      ) {
        energySum +=
          Math.pow(
            10,
            db / 10
          );
      }

      const averageEnergy =
        energySum /
        measurements.length;

      let leqDb =
        10 *
        Math.log10(
          averageEnergy
        );

      // ==================================================
      // PEAK
      // ==================================================

      let peakDb =
        peakRef.current;

      // ==================================================
      // SAFETY
      // ==================================================

      leqDb = Math.max(
        0,
        Math.min(
          140,
          leqDb
        )
      );

      peakDb = Math.max(
        0,
        Math.min(
          140,
          peakDb
        )
      );

      console.log(
        "================================"
      );

      console.log(
        "🎙️ AUDIO RESULT"
      );

      console.log(
        "Measurements:",
        measurements.length
      );

      console.log(
        "Duration:",
        durationMinutes,
        "minutes"
      );

      console.log(
        "Leq:",
        leqDb,
        "dBA"
      );

      console.log(
        "Peak:",
        peakDb,
        "dBA"
      );

      console.log(
        "================================"
      );

      // ==================================================
      // FORM DATA
      // ==================================================

      const formData =
        new FormData();

      formData.append(
        "eventId",
        eventId
      );

      formData.append(
        "decibels",
        leqDb.toFixed(2)
      );

      formData.append(
        "leqDb",
        leqDb.toFixed(2)
      );

      formData.append(
        "peakDb",
        peakDb.toFixed(2)
      );

      formData.append(
        "durationMinutes",
        durationMinutes.toFixed(
          4
        )
      );

      // ==================================================
      // SERVER ACTION
      // ==================================================

      const result =
        await createExposureLogAction(
          formData
        );

      if (result?.error) {
        toast.error(
          result.error
        );

        setLoading(false);

        return;
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      toast.success(
        `Measurement saved successfully : ${leqDb.toFixed(
          1
        )} dBA`
      );

      setCurrentDb(0);

      setElapsedSeconds(0);

      setLoading(false);
    };

  // ======================================================
  // FORMAT TIMER
  // ======================================================

  const formatTime = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const secs =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      secs
    ).padStart(
      2,
      "0"
    )}`;
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="space-y-3">

      {/* LIVE LEVEL */}

      {isRecording && (
        <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Volume2 className="w-4 h-4 text-teal-400" />

              <span className="text-xs text-slate-400">
                Live sound level
              </span>

            </div>

            <span className="text-xs font-mono text-slate-500">
              {formatTime(
                elapsedSeconds
              )}
            </span>

          </div>

          <div className="mt-2">

            <span className="text-3xl font-bold text-teal-400 font-mono">
              {currentDb.toFixed(
                1
              )}
            </span>

            <span className="ml-2 text-sm text-slate-500">
              dBA
            </span>

          </div>

        </div>
      )}

      {/* BUTTON */}

      {!isRecording ? (

        <button
          type="button"
          onClick={
            startRecording
          }
          disabled={loading}
          className="px-3 py-1.5 bg-teal-600/20 border border-teal-500/30 hover:bg-teal-600/30 text-teal-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >

          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}

          Record

        </button>

      ) : (

        <button
          type="button"
          onClick={
            stopRecording
          }
          disabled={loading}
          className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >

          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}

          Stop

        </button>

      )}

    </div>
  );
}

