/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {type ReactNode, useState, useCallback, useRef, useEffect} from 'react';
import clsx from 'clsx';
import {prefersReducedMotion, ThemeClassNames} from '@docusaurus/theme-common';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import {useLocation} from '@docusaurus/router';
import DocSidebar from '@theme/DocSidebar';
import ExpandButton from '@theme/DocRoot/Layout/Sidebar/ExpandButton';
import type {Props} from '@theme/DocRoot/Layout/Sidebar';

import styles from './styles.module.css';

const SIDEBAR_WIDTH_STORAGE_KEY = 'doc-sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 300;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 560;

// Reset sidebar state when sidebar changes
// Use React key to unmount/remount the children
// See https://github.com/facebook/docusaurus/issues/3414
function ResetOnSidebarChange({children}: {children: ReactNode}) {
  const sidebar = useDocsSidebar();
  return (
    <React.Fragment key={sidebar?.name ?? 'noSidebar'}>
      {children}
    </React.Fragment>
  );
}

function clampWidth(width: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

export default function DocRootLayoutSidebar({
  sidebar,
  hiddenSidebarContainer,
  setHiddenSidebarContainer,
}: Props): ReactNode {
  const {pathname} = useLocation();
  const asideRef = useRef<HTMLElement>(null);

  const [hiddenSidebar, setHiddenSidebar] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Restore sidebar width from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (saved) {
        const w = parseInt(saved, 10);
        if (!Number.isNaN(w)) {
          document.documentElement.style.setProperty(
            '--doc-sidebar-width',
            `${clampWidth(w)}px`,
          );
        }
      }
    } catch (_) {}
  }, []);

  const toggleSidebar = useCallback(() => {
    if (hiddenSidebar) {
      setHiddenSidebar(false);
    }
    if (!hiddenSidebar && prefersReducedMotion()) {
      setHiddenSidebar(true);
    }
    setHiddenSidebarContainer((value) => !value);
  }, [setHiddenSidebarContainer, hiddenSidebar]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (hiddenSidebarContainer) return;
    setIsResizing(true);
  }, [hiddenSidebarContainer]);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const width = e.clientX;
      const clamped = clampWidth(width);
      document.documentElement.style.setProperty(
        '--doc-sidebar-width',
        `${clamped}px`,
      );
    };

    const onMouseUp = () => {
      setIsResizing(false);
      try {
        const w = document.documentElement.style.getPropertyValue(
          '--doc-sidebar-width',
        );
        const num = parseInt(w, 10);
        if (!Number.isNaN(num)) {
          localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(num));
        }
      } catch (_) {}
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <aside
      ref={asideRef}
      className={clsx(
        ThemeClassNames.docs.docSidebarContainer,
        styles.docSidebarContainer,
        hiddenSidebarContainer && styles.docSidebarContainerHidden,
        isResizing && styles.sidebarResizing,
      )}
      onTransitionEnd={(e) => {
        if (!e.currentTarget.classList.contains(styles.docSidebarContainer!)) {
          return;
        }

        if (hiddenSidebarContainer) {
          setHiddenSidebar(true);
        }
      }}>
      <ResetOnSidebarChange>
        <div
          className={clsx(
            styles.sidebarViewport,
            hiddenSidebar && styles.sidebarViewportHidden,
          )}>
          <DocSidebar
            sidebar={sidebar}
            path={pathname}
            onCollapse={toggleSidebar}
            isHidden={hiddenSidebar}
          />
          {hiddenSidebar && <ExpandButton toggleSidebar={toggleSidebar} />}
        </div>
      </ResetOnSidebarChange>
      {!hiddenSidebarContainer && (
        <div
          className={styles.sidebarResizer}
          onMouseDown={handleResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="拖动调整笔记栏宽度"
        />
      )}
    </aside>
  );
}
