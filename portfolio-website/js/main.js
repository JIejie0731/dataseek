// 示例项目数据
const projects = [
    {
        title: '项目 1',
        description: '这是一个示例项目的描述',
        image: 'images/project1.jpg',
        link: '#'
    },
    {
        title: '项目 2',
        description: '这是另一个示例项目的描述',
        image: 'images/project2.jpg',
        link: '#'
    },
    {
        title: '项目 3',
        description: '这是第三个示例项目的描述',
        image: 'images/project3.jpg',
        link: '#'
    }
];

// 动态添加项目卡片
function createProjectCards() {
    const projectGrid = document.querySelector('.project-grid');
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <img src="${project.image}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <a href="${project.link}" class="project-link">查看详情</a>
        `;
        projectGrid.appendChild(card);
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    createProjectCards();
}); 