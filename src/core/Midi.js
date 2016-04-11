import log from 'loglevel';
import WebMidi from 'webmidi';
import heir from 'heir';
import EventEmitter from 'wolfy87-eventemitter';


export default class Midi {

    /**
    Opens Chrome's Web MIDI API. Must be called first before any other class methods.
    */
    static initialize() {
        if (!WebMidi.connected) {
            Midi.noteStore = [];
            return new Promise((resolve, reject) => {
                WebMidi.enable(() => {
                    log.debug('Web MIDI now initialized and usable!');
                    resolve();
                }, error => {
                    log.error('Could not initialize Web MIDI interface:', error);
                    reject(error);
                })
            });
        }
    }

    /**
    Get a list of MIDI input devices.
     */
    static get inputs() {
        return WebMidi.inputs;
    }

    /**
    Get a list of MIDI output devices.
    */
    static get outputs() {
        return WebMidi.outputs;
    }

    /**
     * Returns the matching MIDI input or output.
     * @param nameOrOptions Either an exact string match of the input/output name, or an object specifying search parameters.
     *     {
     *         name: 'loopbe',
     *         caseSensitiveSearch: false,
     *         usePartialMatch: true
     *     }
     * @returns {*}
     */
    static findDevice(nameOrOptions, inputOrOutput = 'input') {
        let target = inputOrOutput === 'input' ? WebMidi.inputs : WebMidi.outputs;
        if (typeof nameOrOptions === 'string') {
            for (let input in target) {
                if (input.name === nameOrOptions)
                    return input;
            }
        } else {
            for (let input of target) {
                if (!nameOrOptions.caseSensitiveSearch && !nameOrOptions.usePartialMatch) {
                    if (input.name.toLowerCase() === nameOrOptions.name.toLowerCase()) {
                        return input;
                    }
                } else if (!nameOrOptions.caseSensitiveSearch && nameOrOptions.usePartialMatch) {
                    if (input.name.toLowerCase().includes(nameOrOptions.name.toLowerCase())) {
                        return input;
                    }
                } else if (nameOrOptions.caseSensitiveSearch() && !nameOrOptions.usePartialMatch) {
                    if (input.name === nameOrOptions) {
                        return input;
                    }
                } else if (nameOrOptions.caseSensitiveSearch() && nameOrOptions.usePartialMatch) {
                    if (input.name.includes(nameOrOptions)) {
                        return input;
                    }
                }
            }
        }
    }

    /**
    Binds note and controller events to the MIDI inputs included by the specified filters.
    */
    static activate(inputFilter, outputFilter) {
        Midi.inputFilter = inputFilter;
        Midi.outputFilter = outputFilter;
        log.info(`MIDI Input: ${inputFilter.input ? inputFilter.input.name : WebMidi.inputs.map((o) => o.name)} (channel ${inputFilter.channel ? inputFilter.channel : 'all'})`);
        log.info(`MIDI Output: ${outputFilter.output ? outputFilter.output.name : WebMidi.outputs.map((o) => o.name)} (channel ${outputFilter.channel ? outputFilter.channel : 'all'})`);
        WebMidi.addListener('noteon', Midi.onNoteOn, inputFilter);
        WebMidi.addListener('noteoff', Midi.onNoteOff, inputFilter);
        WebMidi.addListener('controlchange', Midi.onControlChange, inputFilter);
        log.debug('Installed listeners for note on, note off, and CC events.');
    }

    /**
    Unbinds all note and controller events.
    */
    static deactivate() {
        WebMidi.removeListener('noteon', Midi.onNoteOn);
        WebMidi.removeListener('noteoff', Midi.onNoteOff);
        WebMidi.removeListener('controlchange', Midi.onControlChange);
        log.debug('Removed listeners for note on, note off, and CC events.');
    }

    static onNoteOn(rawNote) {
        let {
            name,
            number,
            octave,
            receivedTime,
            velocity
        } = rawNote.note;
        let note = new Note(name, number, octave, receivedTime, 0, velocity);
        Midi.noteStore[note.number] = note;
        Midi.emit('noteOn', note);
    }

    static onNoteOff(rawNote) {
        let {
            name,
            number,
            octave,
            receivedTime,
            velocity
        } = rawNote.note;
        let currentNote = new Note(name, number, octave, receivedTime, 0, velocity);
        Midi.emit('noteOff', note);

        let previousNote = Midi.noteStore[number];
        Midi.noteStore[number] = null;
        Event.trigger('note', new Note(name, number, octave, receivedTime, previousNote.receivedTime - receivedTime, velocity));
    }

    static onControlChange(rawCc) {
        Event.trigger('controllerChange', {
            at: WebMidi.time,
            controller: rawCc.controller.number,
            value: rawCc.value
        });
    }

    static playNote({
        note,
        number = note.number,
        velocity = note.velocity,
        duration = note.duration,
        channels = Midi.outputFilter.channel || "all",
        outputs = Midi.outputFilter.output,
        when = 0
    } = {}) {
        WebMidi.playNote(number, velocity, duration === 'hold' ? undefined : duration, outputs, channels, '+' + when);
    }

    static stopNote({
        note,
        velocity = 0,
        channels = Midi.outputFilter.channel || "all",
        outputs = Midi.outputFilter.output,
        when = 0
    } = {}) {
        WebMidi.stopNote(note, velocity, outputs, channels, when);
    }

    static sendControlChange({
        controller,
        value = 0,
        channels = Midi.outputFilter.channel || "all",
        outputs = Midi.outputFilter.output,
        when = 0
    } = {}) {
        WebMidi.sendControlChange(controller, value, outputs, channels, when);
    }

    static get EVENT_MAP() {
        return {
            0x00: 'Sequence Number',
            0x01: 'Text',
            0x02: 'Copyright Notice',
            0x03: 'Track Name',
            0x04: 'Instrument Name',
            0x05: 'Lyrics',
            0x06: 'Marker',
            0x07: 'Cue Point',
            0x20: 'Midi Channel Prefix',
            0x2F: 'End of Track',
            0x51: 'Set Tempo',
            0x54: 'SMTPE Offset',
            0x58: 'Time Signature',
            0x59: 'Key Signature',
            0x7F: 'Sequencer Specific',
            0x8: 'Note Off',
            0x9: 'Note On',
            0xA: 'Aftertouch',
            0xB: 'Controller',
            0xC: 'Program Change',
            0xD: 'Channel Aftertouch',
            0xE: 'Pitch Bend'
        };
    }
}

heir.merge(Midi, new EventEmitter());
