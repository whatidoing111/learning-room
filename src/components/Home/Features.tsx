import FlowingMenu from './FlowingMenu';

const demoItems = [
  { link: '#', text: '沉浸场景', image: 'https://picsum.photos/600/400?random=1' },
  { link: '#', text: '氛围音乐', image: 'https://picsum.photos/600/400?random=2' },
  { link: '#', text: '番茄专注', image: 'https://picsum.photos/600/400?random=3' },
  { link: '#', text: '任务管理', image: 'https://picsum.photos/600/400?random=4' },
];

export default function Features() {
  return (
    <div style={{ height: '160px', position: 'relative' }}>
      <FlowingMenu items={demoItems} bgColor="rgba(255,255,255,0.08)" borderColor="rgba(255,255,255,0.12)" />
    </div>
  );
}
