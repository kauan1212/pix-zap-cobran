import { useEffect, useRef } from 'react';

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

// Instância global do EventBus
export const eventBus = new EventBus();

// Hook para usar o EventBus
export const useEventBus = (event: string, callback: EventCallback) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (...args: any[]) => callbackRef.current(...args);
    eventBus.on(event, handler);
    return () => eventBus.off(event, handler);
  }, [event]);
};

// Função para emitir eventos
export const emitEvent = (event: string, ...args: any[]) => {
  eventBus.emit(event, ...args);
}; 