import * as React from 'react'
import { TestContext } from 'ra-test'
import { DataProviderContext } from 'react-admin'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { ThemeProvider, createTheme } from '@material-ui/core/styles'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AddTracksButton from './AddTracksButton'

const mockSongs = [
  {
    id: 'song-1',
    title: 'Comfortably Numb',
    artist: 'Pink Floyd',
    album: 'The Wall',
    missing: false,
  },
]

const createTestComponent = () => {
  const dataProvider = {
    getList: vi
      .fn()
      .mockResolvedValue({ data: mockSongs, total: mockSongs.length }),
    create: vi.fn().mockResolvedValue({ data: { id: 'pls-1' } }),
  }

  render(
    <DataProviderContext.Provider value={dataProvider}>
      <TestContext>
        <ThemeProvider theme={createTheme()}>
          <AddTracksButton playlistId="pls-1" />
        </ThemeProvider>
      </TestContext>
    </DataProviderContext.Provider>,
  )

  return { dataProvider }
}

describe('AddTracksButton', () => {
  afterEach(cleanup)

  it('adds the selected tracks to the playlist', async () => {
    const { dataProvider } = createTestComponent()

    fireEvent.click(
      screen.getByText('resources.playlist.actions.addTracks', {
        selector: 'span',
      }),
    )

    const addButton = screen.getByTestId('playlist-add-tracks')
    expect(addButton).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'wall' },
    })
    await waitFor(() => {
      expect(screen.getByText('Comfortably Numb')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Comfortably Numb'))
    await waitFor(() => {
      expect(addButton).not.toBeDisabled()
    })

    fireEvent.click(addButton)

    await waitFor(() => {
      expect(dataProvider.create).toHaveBeenCalledWith('playlistTrack', {
        data: { ids: ['song-1'] },
        filter: { playlist_id: 'pls-1' },
      })
    })
  })

  it('discards the selection when cancelled', async () => {
    const { dataProvider } = createTestComponent()

    fireEvent.click(
      screen.getByText('resources.playlist.actions.addTracks', {
        selector: 'span',
      }),
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'wall' },
    })
    await waitFor(() => {
      expect(screen.getByText('Comfortably Numb')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Comfortably Numb'))

    fireEvent.click(screen.getByText('ra.action.cancel'))

    await waitFor(() => {
      expect(screen.queryByText('Comfortably Numb')).not.toBeInTheDocument()
    })
    expect(dataProvider.create).not.toHaveBeenCalled()
  })
})
