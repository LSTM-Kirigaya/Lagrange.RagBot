import os

from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings

embedding = HuggingFaceEmbeddings(model_name='maidalun1020/bce-embedding-base_v1')
db_persistent_dir = 'blog-vecdb'

if os.path.exists(db_persistent_dir):
    db = FAISS.load_local(db_persistent_dir, embedding, allow_dangerous_deserialization=True)
    print('成功从 {} 中提取数据'.format(db_persistent_dir))
else:
    loader = DirectoryLoader('./docs', glob='**/*.md')
    docs = loader.load()
    print('整理得到 {} 个文档'.format(len(docs)))

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = 800,
        chunk_overlap  = 80,
        length_function = len,
        add_start_index = True
    )
    split_docs = text_splitter.split_documents(docs)
    print('分块得到 {} 个文档'.format(len(split_docs)))
    db = FAISS.from_documents(split_docs, embedding)
    db.save_local(db_persistent_dir)
    print('数据库已存储到 {} 中'.format(db_persistent_dir))