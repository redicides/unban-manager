/**
 * The color options for the logger.
 */

interface ColorOptions {
  // ANSI color code
  color?: AnsiColor;
  // Whether to color the full log or just the level
  full?: boolean;
}

/**
 * The supported  ANSI color codes.
 */

export enum AnsiColor {
  Purple = '\x1b[35m',
  Green = '\x1b[32m',
  Orange = '\x1b[38;5;208m',
  Yellow = '\x1b[33m',
  Reset = '\x1b[0m',
  Cyan = '\x1b[36m',
  Grey = '\x1b[90m',
  Red = '\x1b[31m'
}

/**
 * The logger utility class.
 */

export default class Logger {
  /**
   * Log to the console.
   *
   * @param level The log level
   * @param message The message to log to the console
   * @param options The color options for the log
   */

  static log(level: string, message: string, options?: ColorOptions): void {
    const timestamp = new Date().toISOString();
    const timestampString = `${AnsiColor.Grey}[${timestamp}]${AnsiColor.Reset}`;

    if (options?.color && !options.full) {
      console.log(`${timestampString} ${options.color}[${level}]${AnsiColor.Reset} ${message}`);
    } else if (options?.color && options.full) {
      console.log(`${timestampString} ${options.color}[${level}] ${message}${AnsiColor.Reset}`);
    } else {
      console.log(`${timestampString} [${level}] ${message}`);
    }
  }

  /**
   * Log a message to the console with the INFO level.
   *
   * @param message The message to log
   */

  static info(message: string): void {
    Logger.log('INFO', message, {
      color: AnsiColor.Cyan
    });
  }

  /**
   * Log a message to the console with the WARN level.
   *
   * @param message The message to log
   */

  static warn(message: string): void {
    Logger.log('WARN', message, {
      color: AnsiColor.Yellow
    });
  }

  /**
   * Log a message to the console with the ERROR level.
   *
   * @param message The message to log
   * @param values Additional information for logging
   */

  static error(message: string, ...values: readonly unknown[]): void {
    Logger.log('ERROR', message, {
      color: AnsiColor.Red
    });
    console.error(...values);
  }
}
