import logging

from aleph.core import get_graph
from aleph.model import Document, Entity
from aleph.graph.schema import DocumentNode, EmailNode, PhoneNode, MENTIONS
from aleph.graph.collections import add_to_collections
from aleph.graph.entities import load_entity

log = logging.getLogger(__name__)


def load_documents():
    graph = get_graph()
    tx = graph.begin()
    for i, document in enumerate(Document.all()):
        load_document(tx, document)
        if i > 0 and i % 1000 == 0:
            tx.commit()
            tx = graph.begin()
    tx.commit()


def load_document(tx, document):
    if tx is None:
        return
    log.info("Graph load [%s]: %r", document.id, document.meta)
    meta = document.meta
    node = DocumentNode.merge(tx, name=meta.title, alephTitle=document.type,
                              fileName=meta.file_name, fingerprint=document.id,
                              alephDocument=document.id)
    add_to_collections(tx, node, document.collections,
                       alephDocument=document.id)

    for email in meta.emails:
        enode = EmailNode.merge(tx, name=email, fingerprint=email)
        MENTIONS.merge(tx, node, enode, alephDocument=document.id)
        add_to_collections(tx, enode, document.collections,
                           alephDocument=document.id)

    for phone in meta.phone_numbers:
        pnode = PhoneNode.merge(tx, name=phone, fingerprint=phone)
        MENTIONS.merge(tx, node, pnode, alephDocument=document.id)
        add_to_collections(tx, pnode, document.collections,
                           alephDocument=document.id)

    for entity in Entity.all_by_document(document.id):
        enode = load_entity(tx, entity)
        MENTIONS.merge(tx, node, enode,
                       alephDocument=document.id,
                       alephEntity=entity.id)
    return node


def remove_document(tx, document_id):
    if tx is None:
        return
    tx.run("MATCH ()-[r {alephDocument: {id}}]-() DELETE r;", id=document_id)
