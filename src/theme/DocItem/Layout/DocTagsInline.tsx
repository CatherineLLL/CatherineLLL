import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import type {TagMetadata} from '@docusaurus/utils';

import styles from './doc-tags-inline.module.css';

type Props = {
  readonly tags: readonly TagMetadata[];
};

/** Tags only (no "Tags:" label); plain text, no link. */
export default function DocTagsInline({tags}: Props): ReactNode {
  return (
    <ul className={clsx(styles.tags, 'padding--none')}>
      {tags.map((tag) => (
        <li key={tag.permalink} className={styles.tagItem}>
          <span className={styles.badge} title={tag.description}>
            {tag.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
