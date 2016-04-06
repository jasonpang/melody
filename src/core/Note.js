export default class Note {
    constructor(name, number, octave, time, duration, velocity) {
        this.name = name;
        this.number = number;
        this.octave = octave;
        this.time = time;
        this.duration = duration;
        this.velocity = velocity;
    }

    /**
        The MIDI note number of the leftmost piano key.
    */
    static get MIN() {
        return 21;
    }

    /**
        The MIDI note number of the rightmost piano key.
    */
    static get MAX() {
        return 108;
    }

    static get SEQUENCE() {
        return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    }
}
