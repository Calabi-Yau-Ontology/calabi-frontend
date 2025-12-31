export type Language = 'ko' | 'en';

export type Labels = {
  sidebar: {
    homeAria: string;
    categories: string;
    addCategoryAria: string;
    settings: string;
    themeLight: string;
    themeDark: string;
    language: string;
    languageKo: string;
    languageEn: string;
    logout: string;
  };
  header: {
    today: string;
    prevMonth: string;
    nextMonth: string;
    searchPlaceholder: string;
    searchAria: string;
    views: string[];
  };
  month: {
    weekdays: string[];
    moreItems: (count: number) => string;
    moreRows: (count: number) => string;
    tempEventTitle: string;
  };
  modals: {
    close: string;
    dayEventsTitle: (dateKey: string | null) => string;
    dayEventsEmpty: string;
      event: {
        newTitle: string;
        title: string;
        edit: string;
        delete: string;
        titleLabel: string;
        titlePlaceholder: string;
        categoryLabel: string;
        startLabel: string;
        endLabel: string;
        descriptionLabel: string;
        descriptionPlaceholder: string;
        save: string;
        cancel: string;
      };
    calendar: {
      titleCreate: string;
      titleEdit: string;
      nameLabel: string;
      namePlaceholder: string;
      colorLabel: string;
      defaultVisible: string;
      save: string;
      cancel: string;
      delete: string;
      nameError: string;
    };
  };
  validation: {
    titleRequired: string;
    calendarRequired: string;
    startRequired: string;
    endBeforeStart: string;
  };
};

const labels: Record<Language, Labels> = {
  ko: {
    sidebar: {
      homeAria: '홈으로 이동',
      categories: '카테고리',
      addCategoryAria: '카테고리 추가',
      settings: '설정',
      themeLight: '라이트',
      themeDark: '다크',
      language: '언어',
      languageKo: '한국어',
      languageEn: 'English',
      logout: '로그아웃',
    },
    header: {
      today: '오늘',
      prevMonth: '이전 달',
      nextMonth: '다음 달',
      searchPlaceholder: '검색',
      searchAria: '이벤트 검색',
      views: ['일', '주', '월', '년'],
    },
    month: {
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      moreItems: (count) => `+${count}개 더`,
      moreRows: (count) => `+${count}줄 더`,
      tempEventTitle: '일정',
    },
    modals: {
      close: '닫기',
      dayEventsTitle: (dateKey) => (dateKey ? `${dateKey} 이벤트` : '이벤트'),
      dayEventsEmpty: '이 날의 이벤트가 없어요.',
      event: {
        newTitle: '새 이벤트',
        title: '이벤트',
        edit: '수정',
        delete: '삭제',
        titleLabel: '제목',
        titlePlaceholder: '이벤트 제목',
        categoryLabel: '카테고리',
        startLabel: '시작',
        endLabel: '끝(선택)',
        descriptionLabel: '설명(선택)',
        descriptionPlaceholder: '메모',
        save: '저장',
        cancel: '취소',
      },
      calendar: {
        titleCreate: '캘린더 추가',
        titleEdit: '캘린더 편집',
        nameLabel: '이름',
        namePlaceholder: '캘린더 이름',
        colorLabel: '색상',
        defaultVisible: '기본으로 표시',
        save: '저장',
        cancel: '취소',
        delete: '삭제',
        nameError: '캘린더 이름을 입력하세요.',
      },
    },
    validation: {
      titleRequired: '제목을 입력하세요.',
      calendarRequired: '캘린더를 선택하세요.',
      startRequired: '시작 날짜를 선택하세요.',
      endBeforeStart: '끝 날짜는 시작 날짜보다 빠를 수 없어요.',
    },
  },
  en: {
    sidebar: {
      homeAria: 'Go to home',
      categories: 'Categories',
      addCategoryAria: 'Add calendar',
      settings: 'Settings',
      themeLight: 'Light',
      themeDark: 'Dark',
      language: 'Language',
      languageKo: 'Korean',
      languageEn: 'English',
      logout: 'Log out',
    },
    header: {
      today: 'Today',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      searchPlaceholder: 'Search',
      searchAria: 'Search events',
      views: ['Day', 'Week', 'Month', 'Year'],
    },
    month: {
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      moreItems: (count) => `+${count} more`,
      moreRows: (count) => `+${count} more`,
      tempEventTitle: 'Event',
    },
    modals: {
      close: 'Close',
      dayEventsTitle: (dateKey) => (dateKey ? `${dateKey} Events` : 'Events'),
      dayEventsEmpty: 'No events for this day.',
      event: {
        newTitle: 'New Event',
        title: 'Event',
        edit: 'Edit',
        delete: 'Delete',
        titleLabel: 'Title',
        titlePlaceholder: 'Event title',
        categoryLabel: 'Category',
        startLabel: 'Start',
        endLabel: 'End (optional)',
        descriptionLabel: 'Description (optional)',
        descriptionPlaceholder: 'Notes',
        save: 'Save',
        cancel: 'Cancel',
      },
      calendar: {
        titleCreate: 'Add Calendar',
        titleEdit: 'Edit Calendar',
        nameLabel: 'Name',
        namePlaceholder: 'Calendar name',
        colorLabel: 'Color',
        defaultVisible: 'Show by default',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        nameError: 'Please enter a calendar name.',
      },
    },
    validation: {
      titleRequired: 'Please enter a title.',
      calendarRequired: 'Please choose a calendar.',
      startRequired: 'Please select a start date.',
      endBeforeStart: 'End date cannot be before the start date.',
    },
  },
};

export function getLabels(language: Language): Labels {
  return labels[language];
}
