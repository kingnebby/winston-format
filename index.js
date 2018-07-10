#! /usr/bin/env node

let {
  inspect
} = require('util')
let {
  format,
  levels
} = require('logform')
const {
  MESSAGE,
  LEVEL,
  configs,
} = require('triple-beam');

// Set colors for colorize format.
levels(configs.cli.colors)
let formatter = format.combine(
  format.padLevels(),
  format.colorize(),
  format.simple(),
)

// Custom colorizer for timestamps.
const cc = new format.colorize.Colorizer()
cc.addColors({
  timestamp: 'black'
})

// For each string rebuild the info object that each logform format expects.
function processData(data) {
  let lines = data.toString().split('\n')
  lines.forEach(line => {
    if (line.length < 1) return
    let info
    try {
      info = JSON.parse(line)
    } catch (e) {
      // ignore non json lines.
      return
    }

    const timestamp = getTimestamp(info)

    // Required for colorize.
    info[LEVEL] = info.level

    formatter.transform(info)
    write(timestamp, info)
  })
}

// Timestamp could either be in the root object or in the metadata object.
// Will clean up metadata object if timestamp is the only object.
function getTimestamp(info) {
  let timestamp = info.timestamp || info.metadata && info.metadata.timestamp
  if (timestamp) {
    delete info.timestamp
    info.metadata && delete info.metadata.timestamp
  }
  // If no other metadata, then remove the entry.
  if (info.metadata && Object.keys(info.metadata).length === 0) {
    delete info.metadata
  }
  return timestamp
}

// Write out the processed log info.
function write(timestamp = '', info) {
  process.stdout.write(`${cc.colorize('timestamp', timestamp)} ${info[MESSAGE]}\n`)
}

// Listen for incoming data.
process.stdin.on('data', processData)