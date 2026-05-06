import React from 'react'
import './PublicNewWordCollections.css'
import TopicNewWords from './TopicNewWords'
import {ArrowRightSquare} from 'lucide-react'

const Topics = ({collection, isLoading, handleCloneTopic}) => {

	if(isLoading) return(
		<div className='public_topic_container'>
			<div className="public_topic_header">
				<div className="public_topic" style={{width: "40%"}}>
					<div className="skeleton line"></div>
					<div className="skeleton line"></div>
				</div>
				<div className='public_topic_owner' style={{width: "50%"}}>
					<div className="skeleton line" style={{width: "100%"}}></div>
				</div>
			</div>
			<div className="public_topic_desc">
				<div className="skeleton line" ></div>
			</div>
			<div className="skeleton blox"></div>
		</div>
	)

  return (
    <div className='public_topic_container'>
      <div className="public_topic_header">
        <div className="public_topic">
			{collection.topic}
			<p>({collection.include} words)</p>
			</div>
        <div className='public_topic_owner'>created by {collection.owner || "AIELTS"} 
          <ArrowRightSquare className='save_public_collection_btn' onClick={handleCloneTopic}>
            <title>Save to your board</title>
          </ArrowRightSquare>
        </div>
      </div>
      <div className="public_topic_desc">{collection.description}</div>
      <TopicNewWords words={collection.words}/>
    </div>
  )
}

export default Topics
