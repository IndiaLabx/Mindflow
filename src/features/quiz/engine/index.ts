import { quizEngine } from './quizEngine';
import { mcqPlugin } from './plugins/mcqPlugin';
import { synonymPlugin } from './plugins/synonymPlugin';

// Register standard plugins at startup
quizEngine.register(mcqPlugin);
quizEngine.register(synonymPlugin);

export { quizEngine };
export * from './quizPlugin';
