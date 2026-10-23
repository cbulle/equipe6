import {
  onSnapshot,
  queryEqual,
  refEqual,
  type DocumentReference,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface SnapshotState<Source, Data> {
  /** The query / reference the data was received for. */
  source: Source | null;
  data: Data;
  error: Error | null;
}

/**
 * Keeps the previous instance while the new value is deemed equal, so that effects
 * depending on a freshly built query/reference do not re-subscribe at every render.
 * Uses the "store information from previous renders" pattern from the React docs.
 */
function useStableValue<V>(value: V, isEqual: (previous: V, next: V) => boolean): V {
  const [stableValue, setStableValue] = useState(value);
  if (stableValue !== value && !isEqual(stableValue, value)) {
    setStableValue(value);
    return value;
  }
  return stableValue;
}

const isSameQuery = (previous: Query | null, next: Query | null) =>
  previous === next || (previous !== null && next !== null && queryEqual(previous, next));

const isSameReference = (previous: DocumentReference | null, next: DocumentReference | null) =>
  previous === next || (previous !== null && next !== null && refEqual(previous, next));

const EMPTY_LIST: never[] = [];

/** Subscribes in real time to a Firestore query. Pass `null` to skip the subscription. */
export function useCollectionData<T extends { id: string }>(query: Query | null) {
  const stableQuery = useStableValue(query, isSameQuery);
  const [state, setState] = useState<SnapshotState<Query, T[]>>({ source: null, data: [], error: null });

  useEffect(() => {
    if (!stableQuery) {
      return undefined;
    }
    return onSnapshot(
      stableQuery,
      (snapshot) =>
        setState({
          source: stableQuery,
          data: snapshot.docs.map((document) => ({ ...document.data(), id: document.id }) as T),
          error: null,
        }),
      (error) => setState({ source: stableQuery, data: [], error }),
    );
  }, [stableQuery]);

  const isCurrent = stableQuery !== null && state.source === stableQuery;
  return {
    data: isCurrent ? state.data : (EMPTY_LIST as T[]),
    loading: stableQuery !== null && !isCurrent,
    error: isCurrent ? state.error : null,
  };
}

/** Subscribes in real time to a Firestore document. Pass `null` to skip the subscription. */
export function useDocumentData<T extends { id: string }>(reference: DocumentReference | null) {
  const stableReference = useStableValue(reference, isSameReference);
  const [state, setState] = useState<SnapshotState<DocumentReference, T | null>>({
    source: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!stableReference) {
      return undefined;
    }
    return onSnapshot(
      stableReference,
      (snapshot) =>
        setState({
          source: stableReference,
          data: snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as T) : null,
          error: null,
        }),
      (error) => setState({ source: stableReference, data: null, error }),
    );
  }, [stableReference]);

  const isCurrent = stableReference !== null && state.source === stableReference;
  return {
    data: isCurrent ? state.data : null,
    loading: stableReference !== null && !isCurrent,
    error: isCurrent ? state.error : null,
  };
}
