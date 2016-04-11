import Note from './Note.js';
import log from 'loglevel';
import StackTrace from 'stacktrace-js';


export default class Utils {

    /**
     * Returns the friendly note name for the MIDI note number.
     * @param  {int} number The MIDI note number from 21 (lowest possible key A) to 108 (highest possible key C).
     * @return {string} Returns the friendly note name (e.g. "G#").
     */
    static noteNumberToName(number) {
        return Note.SEQUENCE[number % 12];
    }

    static noteNumberToOctave(number) {
        return Math.floor((number / 12) - 1) - 3;
    }

    static avg(...numbers) {
        let sum = 0;
        for (let number of numbers)
            sum += number;
        return sum / numbers.length;
    }

    static panic(e) {
        StackTrace.fromError(e).then(s => {
            if (s && s.length > 0) {
                let stackInfo = s[0];
                let filename = stackInfo.fileName.replace('webpack:///', 'webpack:///./');
                log.error(e, `@ ${filename}:${stackInfo.lineNumber}:${stackInfo.columnNumber}`);
            } else {
                log.error(e);
            }
        }).catch(x => log.error(e));
    }
}
