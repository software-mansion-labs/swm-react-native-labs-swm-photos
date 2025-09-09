import { colors } from "@/config/colors";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Label } from "./Label";

export default function LoadingProgressView({
  total,
  current,
  label,
}: {
  total: number;
  current: number;
  label?: string;
}) {
  const elapsedSeconds = useElapsedSeconds({ total, current });
  const eta = useETA({ total, current });

  return (
    <View style={styles.container}>
      <View
        style={{
          width: `${(current / total) * 100}%`,
          height: 20,
          backgroundColor: colors.green,
        }}
      />
      <Label>
        {current} / {total} | {((current / total) * 100).toFixed(1)}% | ETA:{" "}
        {(eta && `${eta.toFixed(1)}s`) ?? "N/A"} | Elapsed:{" "}
        {(elapsedSeconds != null && `${elapsedSeconds.toFixed(1)}s`) || "N/A"} |{" "}
        {label}
      </Label>
    </View>
  );
}

function useElapsedSeconds({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number | undefined>(
    undefined,
  );

  const elapsedSecondsIntervalId = useRef<number>(undefined);
  const startElapsedSecondsTimer = useCallback(() => {
    setElapsedSeconds(0);
    // @ts-expect-error - setInterval returns a number
    elapsedSecondsIntervalId.current = setInterval(() => {
      setElapsedSeconds((prev) => Number(((prev ?? 0) + 0.1).toFixed(1)));
    }, 100);

    return () => {
      if (elapsedSecondsIntervalId.current) {
        clearInterval(elapsedSecondsIntervalId.current);
      }
    };
  }, []);

  const stopElapsedSecondsTimer = useCallback(() => {
    if (elapsedSecondsIntervalId.current) {
      clearInterval(elapsedSecondsIntervalId.current);
    }
  }, []);

  const memoizedTotal = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (memoizedTotal.current !== total && current !== total) {
      memoizedTotal.current = total;
      stopElapsedSecondsTimer();
      startElapsedSecondsTimer();
      return;
    }

    if (current === total) {
      stopElapsedSecondsTimer();
    }
  }, [current, total, startElapsedSecondsTimer, stopElapsedSecondsTimer]);

  return elapsedSeconds;
}

function useETA({ total, current }: { total: number; current: number }) {
  const [eta, setEta] = useState<number | null>(null);
  const [, setTimePerUnit] = useState<
    { timestamp: number; current: number; total: number }[]
  >([]);

  const initEta = useCallback(
    (timestamp: number, current: number, total: number) => {
      setEta(null);
      setTimePerUnit([{ timestamp, current, total }]);
    },
    [],
  );

  const calculateEta = useCallback(
    (timestamp: number, current: number, total: number) => {
      setTimePerUnit((prev) => {
        const result = [...prev, { timestamp, current, total }];

        const workTimePairs = result.slice(1).map((chunk, index) => {
          const prevChunk = result[index];
          const amountOfWork = chunk.current - prevChunk.current;
          const duration = chunk.timestamp - prevChunk.timestamp;
          return { amountOfWork, duration };
        });

        // Calculate time per unit of work with weighted recent history
        const timePerUnit =
          workTimePairs
            .slice(-10) // Take last 10 items
            .reduce((acc, pair, index, array) => {
              const weight = array.length - index; // Weight from 10 to 1
              const timePerUnit = pair.duration / pair.amountOfWork;
              return acc + timePerUnit * weight;
            }, 0) /
          // Divide by sum of weights
          (workTimePairs.length >= 10
            ? 55 // Sum of 1-10
            : (workTimePairs.length * (workTimePairs.length + 1)) / 2); // Sum of 1-n

        const remainingWork = total - result[result.length - 1].current;
        const estimatedRemainingTime = remainingWork * timePerUnit;

        setEta(Number((estimatedRemainingTime / 1000).toFixed(1))); // Convert milliseconds to seconds

        return result;
      });
    },
    [],
  );

  const memoizedTotal = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (memoizedTotal.current !== total && current === 0) {
      memoizedTotal.current = total;
      initEta(Date.now(), current, total);
      return;
    }

    if (current === total) {
      setEta(null);
      return;
    }

    if (current > 0) {
      calculateEta(Date.now(), current, total);
    }
  }, [total, current, initEta, calculateEta]);

  useEffect(() => {
    if (current === 0) {
      setEta(null);
    }
  }, [current, total]);

  return eta;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
