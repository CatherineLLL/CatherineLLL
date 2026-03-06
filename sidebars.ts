import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: '笔记',
      link: {
        type: 'doc',
        id: 'intro',
      },
      items: ['go-basics', 'cpp'],
      collapsible: false,
    },
  ],
};

export default sidebars;
