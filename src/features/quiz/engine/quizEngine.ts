import { QuizPlugin } from './quizPlugin';

class QuizEngine {
  private plugins: Map<string, QuizPlugin<any, any>> = new Map();

  /**
   * Registers a new quiz plugin (strategy) into the engine.
   */
  register(plugin: QuizPlugin<any, any>) {
    if (this.plugins.has(plugin.type)) {
      console.warn(`[QuizEngine] Plugin type '${plugin.type}' is already registered and will be overwritten.`);
    }
    this.plugins.set(plugin.type, plugin);
  }

  /**
   * Retrieves a specific plugin by type. Throws if not found.
   */
  getPlugin<Q, A>(type: string): QuizPlugin<Q, A> {
    const plugin = this.plugins.get(type);
    if (!plugin) {
      throw new Error(`[QuizEngine] Unknown quiz plugin type: '${type}'. Ensure it is registered.`);
    }
    return plugin as QuizPlugin<Q, A>;
  }

  /**
   * Returns a list of all currently registered plugin types.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.plugins.keys());
  }
}

// Export as a singleton instance for global app usage
export const quizEngine = new QuizEngine();
