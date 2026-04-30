import { useRef, useState } from "react"
import { Link } from "react-router"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { DetailSheet } from "~/components/detail-sheet"
import { Button, buttonVariants } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useCreateShoppingItem } from "~/features/shopping/use-create-shopping-item"
import { useMaaleenheterLookup } from "~/features/shopping/use-maaleenheter-lookup"
import { useShoppingList } from "~/features/shopping/use-shopping-list"
import { useUpdateShoppingItem } from "~/features/shopping/use-update-shopping-item"
import { useVaretyperLookup } from "~/features/shopping/use-varetyper-lookup"
import type { ActiveShoppingListRow } from "~/features/shopping/types"
import { ApiError } from "~/lib/api-fetch"
import { cn } from "~/lib/utils"

const SHOP_ITEM_SHEET_TITLE_ID = "shop-item-sheet-title"

const selectStyles = cn(
  "h-9 w-full min-w-0 rounded-4xl border border-input bg-input/30 px-3 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
)

function sourceKindLabel(kilde: string): string {
  if (kilde === "plannedMeal") return "Fra planen"
  return "Manuelt"
}

function formatQuantityLine(row: ActiveShoppingListRow): string {
  if (row.kvantitet == null) return "Ingen mengde"
  const u = row.maaleenhet?.trim() ? ` ${row.maaleenhet}` : ""
  return `${row.kvantitet}${u}`
}

function itemDisplayName(row: ActiveShoppingListRow): string {
  const n = row.varenavn?.trim()
  if (n) return n
  return row.varetype
}

export default function ShopRoute() {
  const listQuery = useShoppingList()
  const varetyperQuery = useVaretyperLookup()
  const maaleenheterQuery = useMaaleenheterLookup()
  const createItem = useCreateShoppingItem()
  const updateItem = useUpdateShoppingItem()

  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusRef = useRef<HTMLButtonElement | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [varetypeIdStr, setVaretypeIdStr] = useState("")
  const [maaleenhetIdStr, setMaaleenhetIdStr] = useState("")
  const [kvantitetStr, setKvantitetStr] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [editingKilde, setEditingKilde] = useState<string | null>(null)
  const [editingVareId, setEditingVareId] = useState<number | null>(null)
  const [editingVaretypeId, setEditingVaretypeId] = useState<number | null>(null)

  const lookupsLoading = varetyperQuery.isLoading || maaleenheterQuery.isLoading
  const lookupsError = varetyperQuery.isError || maaleenheterQuery.isError

  function openAdd(trigger?: HTMLButtonElement) {
    if (trigger) returnFocusRef.current = trigger
    else returnFocusRef.current = addButtonRef.current
    setSheetMode("add")
    setEditingId(null)
    setEditingKilde(null)
    setEditingVareId(null)
    setEditingVaretypeId(null)
    setVaretypeIdStr("")
    setMaaleenhetIdStr("")
    setKvantitetStr("")
    setFormError(null)
    setSheetOpen(true)
  }

  function openEdit(row: ActiveShoppingListRow, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger
    setSheetMode("edit")
    setEditingId(row.id)
    setEditingKilde(row.kilde)
    setEditingVareId(row.vareId)
    setEditingVaretypeId(row.varetypeId)
    setVaretypeIdStr(String(row.varetypeId))
    setMaaleenhetIdStr(row.maaleenhetId != null ? String(row.maaleenhetId) : "")
    setKvantitetStr(row.kvantitet != null ? String(row.kvantitet) : "")
    setFormError(null)
    setSheetOpen(true)
  }

  function closeSheet(open: boolean) {
    setSheetOpen(open)
    if (!open) setFormError(null)
  }

  function parseQuantity(raw: string): { ok: true; value: number | null } | { ok: false; message: string } {
    const t = raw.trim()
    if (t.length === 0) return { ok: true, value: null }
    const normalized = t.replace(",", ".")
    const n = Number(normalized)
    if (!Number.isFinite(n)) return { ok: false, message: "Mengde må være et tall." }
    if (n < 0) return { ok: false, message: "Mengde kan ikke være negativ." }
    return { ok: true, value: n }
  }

  function saveItem() {
    setFormError(null)
    const qtyResult = parseQuantity(kvantitetStr)
    if (!qtyResult.ok) {
      setFormError(qtyResult.message)
      return
    }
    const varetypeId = Number(varetypeIdStr)
    if (!varetypeIdStr || Number.isNaN(varetypeId) || varetypeId < 1) {
      setFormError("Velg varetype.")
      return
    }
    const maaleenhetId = maaleenhetIdStr === "" ? null : Number(maaleenhetIdStr)
    if (maaleenhetIdStr !== "" && Number.isNaN(maaleenhetId)) {
      setFormError("Ugyldig måleenhet.")
      return
    }

    const body = {
      varetypeId,
      kvantitet: qtyResult.value,
      maaleenhetId,
      vareId:
        sheetMode === "edit" && editingVaretypeId === varetypeId
          ? editingVareId
          : null,
    }

    const onError = (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : "Noe gikk galt. Prøv igjen."
      toast.error(msg)
    }

    if (sheetMode === "add") {
      createItem.mutate(body, {
        onSuccess: () => {
          toast.success("Vare lagt til")
          setSheetOpen(false)
        },
        onError,
      })
      return
    }

    if (editingId == null) return
    updateItem.mutate(
      { id: editingId, body },
      {
        onSuccess: () => {
          toast.success("Vare oppdatert")
          setSheetOpen(false)
        },
        onError,
      },
    )
  }

  const sheetTitle = sheetMode === "add" ? "Legg til vare" : "Rediger vare"
  const sheetDescription =
    sheetMode === "edit" && editingKilde === "plannedMeal"
      ? "Rader fra ukesplanen beholder kobling til måltidene når du lagrer."
      : undefined

  const list = listQuery.data?.varer ?? []
  const listEmpty = listQuery.isSuccess && list.length === 0
  const listLoading = listQuery.isLoading

  return (
    <div className="flex min-h-0 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Handleliste</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Aktive varer i husholdningen</p>
          </div>
          <Button
            ref={addButtonRef}
            type="button"
            size="sm"
            className="shrink-0 gap-1"
            onClick={() => openAdd(addButtonRef.current ?? undefined)}
          >
            <Plus className="size-4" aria-hidden />
            Legg til
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 pb-6 pt-4">
        {listQuery.isError ? (
          <section
            className="flex min-h-[220px] flex-col justify-center gap-4 rounded-xl border border-border bg-card/40 p-4"
            aria-live="polite"
          >
            <div>
              <h2 className="text-base font-medium">Kunne ikke laste handlelisten</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sjekk nettverket og prøv på nytt.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={listQuery.isFetching}
              onClick={() => void listQuery.refetch()}
            >
              Prøv igjen
            </Button>
          </section>
        ) : null}

        {listLoading && !listQuery.isError ? (
          <ul className="space-y-2" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="h-[4.25rem] animate-pulse rounded-xl bg-muted/60"
              />
            ))}
          </ul>
        ) : null}

        {listQuery.isSuccess && listEmpty ? (
          <section
            className="flex min-h-[280px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center"
            aria-label="Tom handleliste"
          >
            <div className="max-w-xs space-y-2">
              <p className="text-base font-medium text-foreground">Ingenting her ennå</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Legg til det du trenger, eller hent forslag fra ukens plan under Plan.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
              <Button type="button" className="w-full sm:w-auto" onClick={() => openAdd()}>
                Legg til vare
              </Button>
              <Link
                to="/app/plan"
                className={buttonVariants({
                  variant: "outline",
                  className: "inline-flex w-full min-h-11 justify-center rounded-2xl sm:w-auto",
                })}
              >
                Gå til plan
              </Link>
            </div>
          </section>
        ) : null}

        {listQuery.isSuccess && !listEmpty ? (
          <ul className="space-y-2">
            {list.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-border/80 bg-card/50 px-3 py-2.5 shadow-sm"
              >
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatQuantityLine(row)}
                      </span>
                      <span className="min-w-0 break-words text-sm font-medium leading-snug">
                        {itemDisplayName(row)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">{sourceKindLabel(row.kilde)}</span>
                      <span aria-hidden> · </span>
                      <span>{row.brukernavn}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={`Rediger ${itemDisplayName(row)}`}
                    onClick={(e) => openEdit(row, e.currentTarget)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={closeSheet}
        labelledById={SHOP_ITEM_SHEET_TITLE_ID}
        title={sheetTitle}
        description={sheetDescription}
        returnFocusRef={returnFocusRef}
        footer={
          <div className="flex w-full gap-2 px-1">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 rounded-2xl"
              disabled={createItem.isPending || updateItem.isPending}
              onClick={() => closeSheet(false)}
            >
              Avbryt
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1 rounded-2xl"
              disabled={
                lookupsLoading ||
                lookupsError ||
                createItem.isPending ||
                updateItem.isPending
              }
              onClick={() => saveItem()}
            >
              {createItem.isPending || updateItem.isPending ? "Lagrer…" : "Lagre"}
            </Button>
          </div>
        }
      >
        {lookupsError ? (
          <p className="text-sm text-destructive">Kunne ikke laste varetyper eller måleenheter.</p>
        ) : lookupsLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-9 animate-pulse rounded-4xl bg-muted" />
            <div className="h-9 animate-pulse rounded-4xl bg-muted" />
            <div className="h-9 animate-pulse rounded-4xl bg-muted" />
          </div>
        ) : (
          <div className="space-y-4">
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="shop-varetype">Varetype</Label>
              <select
                id="shop-varetype"
                className={selectStyles}
                value={varetypeIdStr}
                onChange={(e) => setVaretypeIdStr(e.target.value)}
              >
                <option value="">Velg …</option>
                {(varetyperQuery.data ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.varetype}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-maaleenhet">Måleenhet</Label>
              <select
                id="shop-maaleenhet"
                className={selectStyles}
                value={maaleenhetIdStr}
                onChange={(e) => setMaaleenhetIdStr(e.target.value)}
              >
                <option value="">Ingen</option>
                {(maaleenheterQuery.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.enhet}
                    {m.type ? ` (${m.type})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-kvantitet">Mengde (valgfritt)</Label>
              <Input
                id="shop-kvantitet"
                inputMode="decimal"
                autoComplete="off"
                placeholder="La stå tom for påminnelse"
                value={kvantitetStr}
                onChange={(e) => setKvantitetStr(e.target.value)}
                aria-invalid={formError?.includes("Mengde") ? true : undefined}
              />
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  )
}
