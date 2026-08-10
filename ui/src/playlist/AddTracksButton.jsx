import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  useDataProvider,
  useNotify,
  useRefresh,
  useTranslate,
} from 'react-admin'
import {
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import { SelectTracksInput } from './SelectTracksInput'

const useStyles = makeStyles({
  dialogPaper: {
    height: '32em',
    maxHeight: '32em',
  },
  dialogContent: {
    height: '23.5em',
    overflowY: 'auto',
    paddingTop: '0.5em',
    paddingBottom: '0.5em',
  },
})

const AddTracksButton = ({ playlistId }) => {
  const classes = useStyles()
  const translate = useTranslate()
  const dataProvider = useDataProvider()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [selectedTracks, setSelectedTracks] = useState([])

  const handleOpen = useCallback(() => {
    setSelectedTracks([])
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setSelectedTracks([])
  }, [])

  const handleSubmit = useCallback(() => {
    const ids = selectedTracks.map((track) => track.id)
    dataProvider
      .create('playlistTrack', {
        data: { ids },
        filter: { playlist_id: playlistId },
      })
      .then(() => {
        notify('message.songsAddedToPlaylist', {
          messageArgs: { smart_count: ids.length },
        })
        refresh()
      })
      .catch(() => {
        notify('ra.page.error', 'warning')
      })
    handleClose()
  }, [dataProvider, handleClose, notify, playlistId, refresh, selectedTracks])

  return (
    <>
      <Button
        onClick={handleOpen}
        label={translate('resources.playlist.actions.addTracks')}
      >
        <AddIcon />
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-add-tracks"
        fullWidth={true}
        maxWidth={'sm'}
        classes={{ paper: classes.dialogPaper }}
      >
        <DialogTitle id="form-dialog-add-tracks">
          {translate('resources.playlist.actions.addTracks')}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <SelectTracksInput onChange={setSelectedTracks} />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleClose} color="primary">
            {translate('ra.action.cancel')}
          </MuiButton>
          <MuiButton
            onClick={handleSubmit}
            color="primary"
            disabled={selectedTracks.length === 0}
            data-testid="playlist-add-tracks"
          >
            {translate('ra.action.add')}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

AddTracksButton.propTypes = {
  playlistId: PropTypes.string.isRequired,
}

export default AddTracksButton
