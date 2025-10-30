import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should initialize with initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
  });

  it('should initialize with value from localStorage if it exists', () => {
    // Pre-populate localStorage
    localStorage.setItem('test-key', JSON.stringify('stored'));
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('stored');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });
    
    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should handle objects correctly', () => {
    type TestObject = { name: string; age: number };
    const initialObj: TestObject = { name: 'John', age: 30 };
    
    const { result } = renderHook(() => useLocalStorage<TestObject>('test-key', initialObj));
    
    expect(result.current[0]).toEqual(initialObj);
    
    act(() => {
      result.current[1]({ name: 'Jane', age: 25 });
    });
    
    expect(result.current[0]).toEqual({ name: 'Jane', age: 25 });
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ name: 'Jane', age: 25 });
  });

  it('should handle arrays correctly', () => {
    const initialArray = [1, 2, 3];
    
    const { result } = renderHook(() => useLocalStorage('test-key', initialArray));
    
    expect(result.current[0]).toEqual(initialArray);
    
    act(() => {
      result.current[1]([4, 5, 6]);
    });
    
    expect(result.current[0]).toEqual([4, 5, 6]);
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual([4, 5, 6]);
  });

  it('should handle boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', false));
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem('test-key')).toBe('true');
  });

  it('should handle number values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 42));
    
    expect(result.current[0]).toBe(42);
    
    act(() => {
      result.current[1](100);
    });
    
    expect(result.current[0]).toBe(100);
    expect(localStorage.getItem('test-key')).toBe('100');
  });

  it('should fallback to initial value if localStorage contains invalid JSON', () => {
    // Mock console.error to suppress expected error output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set invalid JSON in localStorage
    localStorage.setItem('test-key', '{invalid json}');
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should work with null as initial value', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('test-key', null));
    
    expect(result.current[0]).toBeNull();
    
    act(() => {
      result.current[1]('not null');
    });
    
    expect(result.current[0]).toBe('not null');
  });

  it('should handle updater function', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10));
    
    act(() => {
      result.current[1](prev => prev + 5);
    });
    
    expect(result.current[0]).toBe(15);
    expect(localStorage.getItem('test-key')).toBe('15');
  });

  it('should persist across multiple hook instances with same key', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('shared-key', 'initial'));
    
    act(() => {
      result1.current[1]('updated');
    });
    
    // Create a second instance with the same key
    const { result: result2 } = renderHook(() => useLocalStorage('shared-key', 'initial'));
    
    // Second instance should read the updated value
    expect(result2.current[0]).toBe('updated');
  });

  it('should handle complex nested objects', () => {
    type ComplexObject = {
      user: { name: string; settings: { theme: string; notifications: boolean } };
      items: number[];
    };
    
    const initial: ComplexObject = {
      user: { name: 'John', settings: { theme: 'dark', notifications: true } },
      items: [1, 2, 3]
    };
    
    const { result } = renderHook(() => useLocalStorage('test-key', initial));
    
    expect(result.current[0]).toEqual(initial);
    
    const updated: ComplexObject = {
      user: { name: 'Jane', settings: { theme: 'light', notifications: false } },
      items: [4, 5, 6]
    };
    
    act(() => {
      result.current[1](updated);
    });
    
    expect(result.current[0]).toEqual(updated);
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual(updated);
  });

  it('should use different keys independently', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));
    
    expect(result1.current[0]).toBe('value1');
    expect(result2.current[0]).toBe('value2');
    
    act(() => {
      result1.current[1]('updated1');
    });
    
    expect(result1.current[0]).toBe('updated1');
    expect(result2.current[0]).toBe('value2'); // Should not change
  });
});
