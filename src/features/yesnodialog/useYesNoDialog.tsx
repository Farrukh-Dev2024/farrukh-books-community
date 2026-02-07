'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type YesNoDialogOptions = {
  title?: string
  content?: React.ReactNode
  onYes?: () => void | Promise<void>
  onNo?: () => void | Promise<void>
}

export function useYesNoDialog() {
  const [dialogOptions, setDialogOptions] = useState<YesNoDialogOptions | null>(null)
  const [promiseResolve, setPromiseResolve] = useState<((value: boolean) => void) | null>(null)

  // 🧠 Unified function that supports both callback and Promise usage
  const showYesNoDialog = useCallback((options: YesNoDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogOptions(options)
      setPromiseResolve(() => resolve)
    })
  }, [])

  const handleYes = async () => {
    if (dialogOptions?.onYes) await dialogOptions.onYes()
    promiseResolve?.(true)
    setDialogOptions(null)
  }

  const handleNo = async () => {
    if (dialogOptions?.onNo) await dialogOptions.onNo()
    promiseResolve?.(false)
    setDialogOptions(null)
  }

  const YesNoDialog = (
    <Dialog open={!!dialogOptions} onOpenChange={(open) => !open && setDialogOptions(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogOptions?.title || 'Confirm'}</DialogTitle>
        </DialogHeader>
        <div className="py-2">{dialogOptions?.content}</div>      
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleNo}>
            No
          </Button>
          <Button onClick={handleYes}>Yes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { showYesNoDialog, YesNoDialog }
}
