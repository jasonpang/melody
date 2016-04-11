import chai from 'chai';
import {
    expect
} from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.should();
chai.use(chaiAsPromised);

import Song from '../../src/core/Song.js';
import Track from '../../src/core/Track.js';
import Note from '../../src/core/Note.js';
import Chord from '../../src/core/Chord.js';
import Utils from '../../src/core/Utils.js';
import HeldNotes from '../../src/core/HeldNotes.js';

describe('core/Song.js', () => {
    describe('MIDI File Loading', () => {
        describe('Can read file', () => {
            it("can read Bach's Minuet in G", done => {
                expect(fetch('assets/Bach - Minuet in G.mid')
                        .then(response => response.blob())
                        .then(buffer => Song.fromMidiFile(buffer))
                        .then(song => {
                            console.log('Song:', song);
                            expect(song).to.not.be.undefined;
                            expect(song.tracks[0].notesCount).to.equal(127);
                            expect(song.tracks[1].notesCount).to.equal(74);
                            expect(song.meta.chordsCount).to.equal(0);
                            done();
                        }))
                    .to.eventually.become.fulfilled;
            });
        });
    });
});
