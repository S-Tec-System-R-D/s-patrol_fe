import { useState, type FormEvent } from 'react'
import type { FieldValue, SimTask, SiteData, TaskField, TaskValues } from '../tasks/types'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

/**
 * 작업 입력 창 (`spec 082`) — 작업의 `fields` 를 보고 그린다.
 * 열 때마다 새로 마운트해(부모가 `key` 를 준다) 기본값이 그때의 사업장 상태로 다시 계산된다.
 */
function FieldControl({
  field,
  value,
  onChange,
}: {
  field: TaskField
  value: FieldValue
  onChange: (value: FieldValue) => void
}) {
  const id = `sim-field-${field.name}`

  if (field.type === 'checkbox') {
    return (
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox id={id} checked={value === true} onCheckedChange={(checked) => onChange(checked)} />
        {field.label}
      </label>
    )
  }

  if (field.type === 'checks') {
    const picked = Array.isArray(value) ? value : []
    const toggle = (optionValue: number) =>
      onChange(
        picked.includes(optionValue)
          ? picked.filter((item) => item !== optionValue)
          : [...picked, optionValue]
      )
    return (
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
          {field.label} <span className="sim-mono text-foreground">{picked.length}</span>
        </legend>
        {field.options.length === 0 ? (
          <p className="text-sm text-muted-foreground">고를 수 있는 항목이 없습니다.</p>
        ) : (
          <ul className="max-h-56 overflow-y-auto rounded-lg border">
            {field.options.map((option) => {
              const order = picked.indexOf(option.value)
              return (
                <li key={option.value} className="border-b last:border-b-0">
                  <label className="flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-sm hover:bg-muted/50">
                    <Checkbox checked={order >= 0} onCheckedChange={() => toggle(option.value)} />
                    <span className="sim-mono w-4 text-xs text-primary">{order >= 0 ? order + 1 : ''}</span>
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.note && <span className="text-xs text-muted-foreground">{option.note}</span>}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </fieldset>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {field.label}
      </label>
      {field.type === 'select' ? (
        <Select items={field.options} value={String(value)} onValueChange={(next) => onChange(String(next))}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'number' ? (
        <Input
          id={id}
          type="number"
          className="sim-mono"
          min={field.min}
          max={field.max}
          value={String(value)}
          onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        />
      ) : (
        <Input id={id} value={String(value)} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  )
}

export function TaskDialog({
  task,
  data,
  onClose,
  onRun,
}: {
  task: SimTask
  data: SiteData
  onClose: () => void
  onRun: (values: TaskValues) => void
}) {
  // 입력 항목과 기본값은 창을 열 때의 사업장 상태로 한 번만 정한다
  const [fields] = useState(() => task.fields(data))
  const [values, setValues] = useState<TaskValues>(() =>
    Object.fromEntries(fields.map((field) => [field.name, field.default]))
  )
  const [problem, setProblem] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = task.validate?.(values, data) ?? null
    setProblem(message)
    if (message === null) onRun(values)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{task.name}</DialogTitle>
            <DialogDescription>
              {data.site.siteName} <span className="sim-mono">#{data.site.siteSeq}</span> · 테스트 서버에 실제로
              반영됩니다.
            </DialogDescription>
          </DialogHeader>

          {/* 입력 항목이 없는 작업은 확인 창으로 쓴다 */}
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">{task.summary(values, data)} — 실행할까요?</p>
          )}
          <div className={fields.length === 0 ? 'hidden' : 'flex flex-col gap-4'}>
            {fields.map((field) => (
              <div key={field.name}>
                <FieldControl
                  field={field}
                  value={values[field.name]}
                  onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
                />
                {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
              </div>
            ))}
          </div>

          {problem && (
            <p role="alert" className="text-sm text-destructive">
              {problem}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">실행</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
