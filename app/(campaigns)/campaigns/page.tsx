'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import { SlidersHorizontal, Sparkles } from 'lucide-react'
import { useCampaigns, useNeedTypes } from '@/api/hooks/useCampaigns'
import { useFilterStore } from '@/store/filterStore'
import { CampaignGrid } from '@/components/campaign/CampaignGrid'
import { SearchBar } from '@/components/campaign/SearchBar'
import { FiltersSidebar } from '@/components/campaign/FiltersSidebar'
import { tk, DashboardGlobalStyle, fadeDown } from '@/styles/dashboardTokens'
import { useT } from '@/lib/i18n/I18nProvider'

// ─── Page shell ───────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: ${tk.canvas};
  font-family: 'DM Sans', sans-serif;
  color: ${tk.body};
`

// ─── Hero header ──────────────────────────────────────────────────────────────
const Hero = styled.header`
  background: ${tk.canvas};
  border-bottom: 2px solid ${tk.blue};
  padding: 24px 16px 20px;

  @media (min-width: 640px) {
    padding: 32px 24px 24px;
  }

  @media (min-width: 1024px) {
    padding: 40px 32px 28px;
  }
`

const HeroInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeDown} 400ms ease both;
`

const HeroEyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${tk.amberDark};
  background: ${tk.amberLight};
  padding: 4px 12px;
  border-radius: 999px;
  margin: 0 0 12px;
`

const HeroTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, ${tk.heading} 0%, ${tk.blue} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
  line-height: 1.2;

  @media (min-width: 640px) {
    font-size: 2rem;
  }

  @media (min-width: 1024px) {
    font-size: 2.4rem;
  }
`

const HeroSub = styled.p`
  font-size: 0.9rem;
  color: ${tk.muted};
  margin: 0;
  font-weight: 400;
  line-height: 1.5;

  @media (min-width: 640px) {
    font-size: 1rem;
  }
`

// ─── Content area ─────────────────────────────────────────────────────────────
const ContentWrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 12px 40px;

  @media (min-width: 640px) {
    padding: 20px 20px 48px;
  }

  @media (min-width: 1024px) {
    padding: 28px 32px 56px;
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 24px;
    align-items: start;
  }

  @media (min-width: 1280px) {
    grid-template-columns: 260px 1fr;
    gap: 28px;
  }
`

// ─── Sidebar (desktop only) ───────────────────────────────────────────────────
const SidebarCol = styled.aside`
  display: none;

  @media (min-width: 1024px) {
    display: block;
    position: sticky;
    top: 80px;
  }
`

// ─── Main column ──────────────────────────────────────────────────────────────
const MainCol = styled.main`
  min-width: 0;
`

// ─── Toolbar (search + mobile filter btn) ─────────────────────────────────────
const Toolbar = styled.div`
  margin-bottom: 14px;

  @media (min-width: 640px) {
    margin-bottom: 16px;
  }
`

// ─── Results bar ──────────────────────────────────────────────────────────────
const ResultsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 8px;
  flex-wrap: wrap;
`

const ResultsCount = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.8rem;
  color: ${tk.muted};
  margin: 0;
  font-weight: 400;

  strong { color: ${tk.heading}; font-weight: 500; }
`

// ─── Mobile filter button ─────────────────────────────────────────────────────
const MobileFilterBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1.5px solid ${p => p.$active ? tk.blue : tk.border};
  background: ${p => p.$active ? tk.blueLight : tk.white};
  color: ${p => p.$active ? tk.blue : tk.body};
  font-family: 'Syne', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 180ms;

  @media (min-width: 1024px) { display: none; }

  &:hover { border-color: ${tk.blue}; color: ${tk.blue}; background: ${tk.blueLight}; }
`

const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  font-weight: 500;
`

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 32px;
  flex-wrap: wrap;
`

const PageBtn = styled.button<{ $active?: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1.5px solid ${p => p.$active ? tk.blue : tk.border};
  background: ${p => p.$active ? tk.blue : tk.white};
  color: ${p => p.$active ? tk.white : tk.body};
  font-family: 'DM Mono', monospace;
  font-size: 0.82rem;
  font-weight: ${p => p.$active ? '500' : '400'};
  cursor: pointer;
  transition: all 180ms;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    border-color: ${tk.blue};
    color: ${p => p.$active ? tk.white : tk.blue};
    background: ${p => p.$active ? '#0D4A8C' : tk.blueLight};
  }
`

const Ellipsis = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.82rem;
  color: ${tk.muted};
  padding: 0 4px;
`

// ─── Count active filters ─────────────────────────────────────────────────────
function countActiveFilters(filters: any): number {
  let count = 0
  if (filters.needTypes?.length > 0) count++
  if (filters.location) count++
  if (filters.minGoal || filters.maxGoal) count++
  if (filters.geographicScope && filters.geographicScope !== 'all') count++
  if (filters.status && filters.status !== 'active') count++
  if (filters.sortBy && filters.sortBy !== 'trending') count++
  return count
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function CampaignBrowsePage() {
  const router = useRouter()
  const { t } = useT()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const {
    filters,
    setSearchQuery,
    setNeedTypes,
    setLocation,
    setGeographicScope,
    setGoalRange,
    setStatus,
    setSortBy,
    setPage,
    resetFilters,
  } = useFilterStore()

  // Set default status on mount
  useEffect(() => {
    if (!filters.status || filters.status === 'all') {
      setStatus('active')
    }
  }, [setStatus])

  const { data: campaignData, isLoading } = useCampaigns(filters.page, filters.limit, filters)
  const { data: needTypesData } = useNeedTypes()

  const handleSearch = useCallback((query: string) => setSearchQuery(query), [setSearchQuery])

  const handleDonate = useCallback((id: string) => router.push(`/campaigns/${id}/donate`), [router])

  const handleShare = useCallback((id: string) => {
    const url = `${window.location.origin}/campaigns/${id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied!', { position: 'bottom-right', autoClose: 2500 })
    })
  }, [])

  const handleFiltersChange = useCallback((updated: any) => {
    if (updated.needTypes && JSON.stringify(updated.needTypes) !== JSON.stringify(filters.needTypes)) {
      setNeedTypes(updated.needTypes)
    }
    if (updated.location !== filters.location || updated.locationRadius !== filters.locationRadius) {
      setLocation(updated.location || '', updated.locationRadius || 0)
    }
    if (updated.minGoal !== filters.minGoal || updated.maxGoal !== filters.maxGoal) {
      setGoalRange(updated.minGoal || 0, updated.maxGoal || 9999999 * 100)
    }
    if (updated.status !== filters.status) setStatus(updated.status)
    if (updated.sortBy !== filters.sortBy) setSortBy(updated.sortBy)
    if (updated.geographicScope !== filters.geographicScope) {
      setGeographicScope(updated.geographicScope)
    }
    // Reset page
    setPage(1)
  }, [filters, setNeedTypes, setLocation, setGeographicScope, setGoalRange, setStatus, setSortBy, setPage])

  const campaigns = campaignData?.campaigns ?? []
  const total = campaignData?.total ?? 0
  const totalPages = campaignData?.totalPages ?? 1
  const needTypes = needTypesData ?? []
  const activeFilterCount = countActiveFilters(filters)

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: (number | '…')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (filters.page > 3) pages.push('…')
      for (let i = Math.max(2, filters.page - 1); i <= Math.min(totalPages - 1, filters.page + 1); i++) {
        pages.push(i)
      }
      if (filters.page < totalPages - 2) pages.push('…')
      pages.push(totalPages)
    }
    return pages
  }

  const start = total > 0 ? (filters.page - 1) * filters.limit + 1 : 0
  const end = Math.min(filters.page * filters.limit, total)

  return (
    <Page>
      <DashboardGlobalStyle />
      {/* Hero */}
      <Hero>
        <HeroInner>
          <HeroEyebrow>
            <Sparkles size={12} />
            {t('campaigns.explore_eyebrow')}
          </HeroEyebrow>
          <HeroTitle>{t('campaigns.explore_title')}</HeroTitle>
          <HeroSub>{t('campaigns.explore_subtitle')}</HeroSub>
        </HeroInner>
      </Hero>

      {/* Content */}
      <ContentWrap>
        {/* Desktop Sidebar */}
        <SidebarCol>
          <FiltersSidebar
            filters={filters}
            needTypes={needTypes}
            onFiltersChange={handleFiltersChange}
            onReset={resetFilters}
          />
        </SidebarCol>

        {/* Main */}
        <MainCol>
          {/* Toolbar */}
          <Toolbar>
            <SearchBar onSearch={handleSearch} />
          </Toolbar>

          {/* Results bar */}
          <ResultsBar>
            <ResultsCount>
              {isLoading
                ? t('campaigns.loading')
                : total > 0
                  ? <><strong>{start}–{end}</strong> of <strong>{total.toLocaleString()}</strong> {t('campaigns.title').toLowerCase()}</>
                  : t('campaigns.no_results')}
            </ResultsCount>
            <MobileFilterBtn
              $active={activeFilterCount > 0}
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal size={14} />
              {t('campaigns.filters')}
              {activeFilterCount > 0 && <FilterBadge>{activeFilterCount}</FilterBadge>}
            </MobileFilterBtn>
          </ResultsBar>

          {/* Grid */}
          <CampaignGrid
            campaigns={campaigns}
            isLoading={isLoading}
            onDonate={handleDonate}
            onShare={handleShare}
          />

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <Pagination aria-label="Campaign pages">
              <PageBtn
                onClick={() => setPage(filters.page - 1)}
                disabled={filters.page === 1}
              >
                ←
              </PageBtn>

              {getPageNumbers().map((p, i) =>
                p === '…' ? (
                  <Ellipsis key={`e${i}`}>…</Ellipsis>
                ) : (
                  <PageBtn
                    key={p}
                    $active={p === filters.page}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </PageBtn>
                )
              )}

              <PageBtn
                onClick={() => setPage(filters.page + 1)}
                disabled={filters.page === totalPages}
              >
                →
              </PageBtn>
            </Pagination>
          )}
        </MainCol>
      </ContentWrap>

      {/* Mobile Filters Drawer */}
      <FiltersSidebar
        filters={filters}
        needTypes={needTypes}
        onFiltersChange={handleFiltersChange}
        onReset={() => { resetFilters(); setMobileFiltersOpen(false) }}
        mobile
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      />
    </Page>
  )
}