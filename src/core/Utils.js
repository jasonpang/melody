import Note from './Note.js';


export default class Utils {
    static noteNumberToName(number) {
        return Note.SEQUENCE[number % 12];
    }

    static noteNumberToOctave(number) {
        return Math.floor((number / 12) - 1) - 3;
    }
}
