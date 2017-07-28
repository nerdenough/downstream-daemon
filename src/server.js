import config from 'config'
import http from 'http'
import low, { fileAsync } from 'lowdb'
import socket from 'socket.io'
import WebTorrent from 'webtorrent'

import { scanFeeds } from './feeds'
import { addTorrent, removeTorrent, pauseTorrent, resumeTorrent, listTorrents } from './torrent'

export const app = http.createServer()
export const io = socket(app)
export const client = new WebTorrent()

app.listen(config.get('port') || 3000)

// Set up the database and load initial torrents
export const db = low('db.json', { storage: fileAsync })
db.defaults({ torrents: [] }).write()
db.get('torrents').map('infoHash').value().forEach(infoHash => addTorrent(infoHash))

io.on('connection', async socket => {
  console.log('Connection established!')
  socket.on('add_torrent', uri => addTorrent(uri, socket))
  socket.on('remove_torrent', torrentId => removeTorrent(torrentId))
  socket.on('pause', torrentId => pauseTorrent(torrentId))
  socket.on('resume', torrentId => resumeTorrent(torrentId))
  socket.on('list_torrents', () => listTorrents(socket))
})

client.on('error', err => {
  console.log('Client Error:', err.message)
})

// Scan feeds for new torrents
scanFeeds()
setInterval(scanFeeds, 3600000)
