import chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.should();
chai.use(chaiAsPromised);

import Note from '../../src/core/Note.js';
import Utils from '../../src/core/Utils.js';

describe('core/Utils.js', () => {
    describe('Note numbers to name / octave', () => {
        it('noteNumberToName', () => {
            expect(Utils.noteNumberToName(Note.MIN)).to.equal('A');
            expect(Utils.noteNumberToName(Note.MAX)).to.equal('C');
        });
        it('noteNumberToOctave', () => {
            expect(Utils.noteNumberToOctave(Note.MIN)).to.equal(-3);
            expect(Utils.noteNumberToOctave(Note.MAX)).to.equal(5);
        });
    });
});
