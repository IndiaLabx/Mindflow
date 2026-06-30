import { useState, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { InitialFilters } from '../types';

/**
 * Custom hook to manage dependent dropdown filters (cascading selects).
 *
 * This hook handles the logic for updating available options in child filters
 * based on the selection in parent filters.
 * Logic: Subject -> Topic -> SubTopic.
 *
 * @param {object} props - The hook properties.
 * @param {InitialFilters} props.selectedFilters - The current state of all selected filters.
 * @param {Dispatch<SetStateAction<InitialFilters>>} props.setSelectedFilters - State setter for updating filters.
 * @param {Map<string, Map<string, Set<string>>>} props.classificationMap - A nested map structure representing the hierarchy: Subject -> Topic -> SubTopics.
 *
 * @returns {object} An object containing:
 * - `availableTopics` {string[]}: List of topics available based on selected subjects.
 * - `availableSubTopics` {string[]}: List of sub-topics available based on selected subjects and topics.
 */
export function useDependentFilters({ selectedFilters, setSelectedFilters, classificationMap }: {
  selectedFilters: InitialFilters;
  setSelectedFilters: Dispatch<SetStateAction<InitialFilters>>;
  classificationMap: Map<string, Map<string, Set<string>>>;
}) {
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableSubTopics, setAvailableSubTopics] = useState<string[]>([]);
  const isInitialMount = useRef(true);

  // Update Topics when Subject changes
  useEffect(() => {
    const newTopics = new Set<string>();
    if (selectedFilters.subject.length > 0) {
      selectedFilters.subject.forEach(subject => {
        classificationMap.get(subject)?.forEach((_, topic) => newTopics.add(topic));
      });
    }
    setAvailableTopics(Array.from(newTopics).filter(Boolean).sort());

    // Reset dependent fields if not initial mount to avoid invalid selections
    if (!isInitialMount.current) {
      setSelectedFilters(prev => ({
          ...prev,
          topic: [],
          subTopic: [],
      }));
    }
  }, [selectedFilters.subject, classificationMap, setSelectedFilters]);

  // Update SubTopics when Topic changes
  useEffect(() => {
    const newSubTopics = new Set<string>();
    if (selectedFilters.topic.length > 0 && selectedFilters.subject.length > 0) {
      selectedFilters.subject.forEach(subject => {
        const topicsMap = classificationMap.get(subject);
        if (topicsMap) {
          selectedFilters.topic.forEach(topic => {
            topicsMap.get(topic)?.forEach(subTopic => newSubTopics.add(subTopic));
          });
        }
      });
    }
    setAvailableSubTopics(Array.from(newSubTopics).filter(Boolean).sort());

    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setSelectedFilters(prev => ({
        ...prev,
        subTopic: [],
      }));
    }
  }, [selectedFilters.topic, selectedFilters.subject, classificationMap, setSelectedFilters]);

  return {
    availableTopics,
    availableSubTopics
  };
}
