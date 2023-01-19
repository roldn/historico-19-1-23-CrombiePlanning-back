import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { io } from '..';
import { v4 as uuid } from 'uuid';

interface Note {
  id: string;
  text: string;
  complete: boolean;
}

let notes: Array<Note> = [];

export const getIssue = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  socket.on('client:newnote', newNote => {
    const note: Note = { id: uuid(), text: newNote, complete: false };
    notes.push(note);
    io.emit('server:newnote', note);
    // io.emit('server:loadnotes', notes);
  });

  socket.on('client:deletenote', removeNote => {
    notes = notes.filter(note => note.id !== removeNote.id);
    io.emit('server:loadnotes', notes);
  });

  socket.on('client:updatenote', updatedNote => {
    notes = notes.map(note => {
      if (note.id === updatedNote.id) {
        note.text = updatedNote.text;
      }
      return note;
    });
    io.emit('server:loadnotes', notes);
  });
};
