import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import TextField from '@material-ui/core/TextField'
import Checkbox from '@material-ui/core/Checkbox'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  makeStyles,
} from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'
import { useDataProvider, useNotify, useTranslate } from 'react-admin'
import config from '../config'

// Max number of results fetched per search. Anything above that requires
// refining the search: the list is meant for picking, not for browsing.
const MAX_RESULTS = 50

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  searchField: {
    marginBottom: theme.spacing(2),
    width: '100%',
    flexShrink: 0,
  },
  trackList: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
  listItem: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  missingItem: {
    opacity: 0.5,
  },
  missingChip: {
    height: '18px',
    marginLeft: theme.spacing(1),
    fontSize: '0.7rem',
  },
  message: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  selectedContainer: {
    marginTop: theme.spacing(2),
    flexShrink: 0,
    maxHeight: '30%',
    overflow: 'auto',
  },
  selectedTrack: {
    display: 'inline-flex',
    alignItems: 'center',
    margin: theme.spacing(0.5),
    padding: theme.spacing(0.5, 1),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.875rem',
  },
  removeButton: {
    marginLeft: theme.spacing(0.5),
    padding: 2,
    color: 'inherit',
  },
}))

const useDebouncedValue = (value, delay) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

const TrackSearchField = ({ searchText, onSearchChange, loading }) => {
  const classes = useStyles()
  const translate = useTranslate()

  return (
    <TextField
      autoFocus
      variant="outlined"
      className={classes.searchField}
      label={translate('ra.action.search')}
      value={searchText}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={translate('resources.playlist.actions.searchTracks')}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: loading && (
          <InputAdornment position="end">
            <CircularProgress size={20} />
          </InputAdornment>
        ),
      }}
    />
  )
}

const TrackListItem = ({ track, isSelected, onToggle }) => {
  const classes = useStyles()
  const translate = useTranslate()

  const subtitle = [track.artist, track.album].filter(Boolean).join(' • ')

  return (
    <ListItem
      className={classes.listItem}
      button
      onClick={() => onToggle(track)}
      dense
    >
      <ListItemIcon>
        <Checkbox
          icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
          checkedIcon={<CheckBoxIcon fontSize="small" />}
          checked={isSelected}
          tabIndex={-1}
          disableRipple
        />
      </ListItemIcon>
      <ListItemText
        className={track.missing ? classes.missingItem : undefined}
        primary={
          <>
            {track.title}
            {track.missing && (
              <Chip
                className={classes.missingChip}
                size="small"
                label={translate('resources.song.fields.missing')}
              />
            )}
          </>
        }
        secondary={subtitle}
      />
    </ListItem>
  )
}

const TrackList = ({ tracks, total, selectedTracks, onToggle, searchText }) => {
  const classes = useStyles()
  const translate = useTranslate()

  if (!searchText) {
    return (
      <List className={classes.trackList}>
        <Typography className={classes.message} variant="body2">
          {translate('resources.playlist.message.searchForTracks')}
        </Typography>
      </List>
    )
  }

  if (tracks.length === 0) {
    return (
      <List className={classes.trackList}>
        <Typography className={classes.message} variant="body2">
          {translate('resources.playlist.message.noTracksFound')}
        </Typography>
      </List>
    )
  }

  const isSelected = (track) => selectedTracks.some((t) => t.id === track.id)

  return (
    <List className={classes.trackList}>
      {tracks.map((track) => (
        <TrackListItem
          key={track.id}
          track={track}
          isSelected={isSelected(track)}
          onToggle={onToggle}
        />
      ))}
      {total > tracks.length && (
        <Typography className={classes.message} variant="body2">
          {translate('resources.playlist.message.tooManyTracks', {
            count: tracks.length,
          })}
        </Typography>
      )}
    </List>
  )
}

const SelectedTrackChip = ({ track, onRemove }) => {
  const classes = useStyles()
  const translate = useTranslate()

  return (
    <span className={classes.selectedTrack}>
      {track.title}
      <IconButton
        className={classes.removeButton}
        size="small"
        onClick={() => onRemove(track)}
        title={translate('resources.playlist.actions.removeFromSelection')}
      >
        {'×'}
      </IconButton>
    </span>
  )
}

const SelectedTracksDisplay = ({ selectedTracks, onRemove }) => {
  const classes = useStyles()

  if (selectedTracks.length === 0) {
    return null
  }

  return (
    <Box className={classes.selectedContainer}>
      <Box>
        {selectedTracks.map((track) => (
          <SelectedTrackChip key={track.id} track={track} onRemove={onRemove} />
        ))}
      </Box>
    </Box>
  )
}

export const SelectTracksInput = ({ onChange }) => {
  const classes = useStyles()
  const dataProvider = useDataProvider()
  const notify = useNotify()
  const [searchText, setSearchText] = useState('')
  const [selectedTracks, setSelectedTracks] = useState([])
  const [results, setResults] = useState({ data: [], total: 0 })
  const [loading, setLoading] = useState(false)

  const query = useDebouncedValue(searchText.trim(), config.uiSearchDebounceMs)

  useEffect(() => {
    if (!query) {
      setResults({ data: [], total: 0 })
      setLoading(false)
      return
    }

    let ignore = false
    setLoading(true)
    dataProvider
      .getList('song', {
        pagination: { page: 1, perPage: MAX_RESULTS },
        sort: { field: 'title', order: 'ASC' },
        filter: { title: query },
      })
      .then(({ data, total }) => {
        if (!ignore) {
          setResults({ data, total })
        }
      })
      .catch(() => {
        if (!ignore) {
          setResults({ data: [], total: 0 })
          notify('ra.page.error', 'warning')
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [query, dataProvider, notify])

  const updateSelection = (newSelection) => {
    setSelectedTracks(newSelection)
    onChange(newSelection)
  }

  const handleToggle = (track) => {
    const isSelected = selectedTracks.some((t) => t.id === track.id)
    updateSelection(
      isSelected
        ? selectedTracks.filter((t) => t.id !== track.id)
        : [...selectedTracks, track],
    )
  }

  const handleRemove = (track) => {
    updateSelection(selectedTracks.filter((t) => t.id !== track.id))
  }

  // Also show the spinner while the debounce is still pending, so typing does
  // not look like it produced stale results
  const searching =
    loading || (!!searchText.trim() && searchText.trim() !== query)

  return (
    <div className={classes.root}>
      <TrackSearchField
        searchText={searchText}
        onSearchChange={setSearchText}
        loading={searching}
      />

      <TrackList
        tracks={results.data}
        total={results.total}
        selectedTracks={selectedTracks}
        onToggle={handleToggle}
        searchText={searchText.trim()}
      />

      <SelectedTracksDisplay
        selectedTracks={selectedTracks}
        onRemove={handleRemove}
      />
    </div>
  )
}

SelectTracksInput.propTypes = {
  onChange: PropTypes.func.isRequired,
}

TrackSearchField.propTypes = {
  searchText: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

TrackListItem.propTypes = {
  track: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
}

TrackList.propTypes = {
  tracks: PropTypes.array.isRequired,
  total: PropTypes.number,
  selectedTracks: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
  searchText: PropTypes.string.isRequired,
}

SelectedTrackChip.propTypes = {
  track: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
}

SelectedTracksDisplay.propTypes = {
  selectedTracks: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
}
